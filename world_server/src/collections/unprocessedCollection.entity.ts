import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
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

@Entity()
export class UnprocessedCollection {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  id!: string;

  @Property()
  contentHash!: string;

  @Index()
  @Property()
  block!: string;

  // TODO: maybe convert to GeoJSON? https://github.com/mikro-orm/mikro-orm/pull/1389
  @Index({ type: 'GIST' })
  @Property({ columnType: 'GEOGRAPHY(POINT)' })
  location!: string;

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

  @Enum()
  @Index()
  @Property({ defaultRaw: 'now()' })
  createdAt!: Date;

  @Property({ defaultRaw: 'now()' })
  updatedAt!: Date;
}
