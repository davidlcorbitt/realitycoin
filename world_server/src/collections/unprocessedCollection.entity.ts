import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Type,
} from '@mikro-orm/core';
import { Point } from 'geojson';
import { User } from 'src/users/user.entity';

export enum UnprocessedCollectionStatus {
  REQUESTED = 'REQUESTED',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum RejectionReason {
  INVALID_COLLECTION = 'INVALID_COLLECTION',
}

class GISPoint extends Type<Point | undefined, string | undefined> {
  convertToDatabaseValue(value: Point | undefined): string | undefined {
    if (!value) {
      return value;
    }

    return `point(${value.coordinates[0]} ${value.coordinates[1]})`;
  }

  convertToJSValue(value: string | undefined): Point | undefined {
    const m = value?.match(/point\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/i);

    if (!m) {
      return undefined;
    }

    return { coordinates: [parseFloat(m[1]), parseFloat(m[3])], type: 'Point' };
  }

  convertToJSValueSQL(key: string) {
    return `ST_AsText(${key})`;
  }

  convertToDatabaseValueSQL(key: string) {
    return `ST_GeomFromText(${key}, 4326)`;
  }

  getColumnType(): string {
    return 'geography(point, 4326)';
  }
}

@Entity()
export class UnprocessedCollection {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property()
  contentHash!: string;

  @Index()
  @Property()
  block!: string;

  // TODO: maybe convert to GeoJSON? https://github.com/mikro-orm/mikro-orm/pull/1389
  @Index({ type: 'GIST' })
  @Property({ type: GISPoint })
  location: Point;

  @ManyToOne({ entity: () => User })
  miner?: User;

  @Enum(() => UnprocessedCollectionStatus)
  status: UnprocessedCollectionStatus = UnprocessedCollectionStatus.REQUESTED;

  @Property({ type: 'string' })
  rejectedReason?: RejectionReason;

  @Property()
  uploaderIp?: string;

  @Property()
  collectedAt!: Date;

  @Index()
  @Property({ defaultRaw: 'now()' })
  createdAt: Date;

  @Property({ defaultRaw: 'now()' })
  updatedAt: Date;

  constructor(data?: Partial<UnprocessedCollection>) {
    Object.assign(this, data);
  }

  storjPath = (): string => `unprocessed_collection/${this.id}`;
}
