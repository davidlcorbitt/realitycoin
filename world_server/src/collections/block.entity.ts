import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { User } from 'src/users/user.entity';

// An H3 block of size 11. The base unit for issuing NFTs.

@Entity()
export class Block {
  // The h3 index of the block.
  @PrimaryKey()
  id!: string;

  @Index()
  @ManyToOne({ entity: () => User })
  owner?: User;

  @Property({ defaultRaw: 'now()' })
  createdAt!: Date;

  @Property({ defaultRaw: 'now()' })
  updatedAt!: Date;
}
