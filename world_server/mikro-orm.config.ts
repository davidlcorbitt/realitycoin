import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Block } from 'src/collections/block.entity';
import { Collection } from 'src/collections/collection.entity';
import { UnprocessedCollection } from 'src/collections/unprocessedCollection.entity';
import { User } from 'src/users/user.entity';

const config: Options = {
  entities: [User, Collection, UnprocessedCollection, Block],
  // entities: ['./dist/**/*.entity.js'],
  // entitiesTs: ['./src/**/*.entity.ts'],
  type: 'postgresql',
  clientUrl: process.env.DATABASE_URL,
  metadataProvider: TsMorphMetadataProvider,
};

export default config;
