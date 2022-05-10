import {
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { User } from '../users/user.entity';
import { UnprocessedCollection } from './unprocessedCollection.entity';

@Entity()
export class Collection {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property()
  contentHash!: string;

  // TODO: maybe convert to GeoJSON? https://github.com/mikro-orm/mikro-orm/pull/1389
  @Index({ type: 'GIST' })
  @Property({ columnType: 'GEOGRAPHY(POINT)' })
  location!: string;

  @Index()
  @Property()
  block!: string;

  @ManyToOne(() => User)
  miner?: User;

  @OneToOne()
  unprocessedCollection: UnprocessedCollection;

  @Property()
  collectedAt!: Date;

  @Property()
  uploadedAt!: Date;

  @Index()
  @Property({ defaultRaw: 'now()' })
  createdAt!: Date;

  @Property({ defaultRaw: 'now()' })
  updatedAt!: Date;
}
