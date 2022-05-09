import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const config: Options = {
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  type: 'postgresql',
  clientUrl: process.env.DATABASE_URL,
  metadataProvider: TsMorphMetadataProvider,
};

export default config;
