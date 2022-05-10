import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

let clientUrl = process.env.DATABASE_URL;
if (process.env.NODE_ENV === 'test') clientUrl = clientUrl + '_test';

const config: Options = {
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  type: 'postgresql',
  clientUrl,
  metadataProvider: TsMorphMetadataProvider,
};

export default config;
