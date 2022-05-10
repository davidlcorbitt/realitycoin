import { Constructor, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test } from '@nestjs/testing';

let entities: Constructor<any>[];
let dbCleaned = false;
export let em: EntityManager;

const ensureCleanDb = async () => {
  if (dbCleaned) return;

  const moduleRef = await Test.createTestingModule({
    imports: [MikroOrmModule.forRoot()],
  }).compile();

  const orm = moduleRef.get<MikroORM>(MikroORM);

  // Save the list of entities
  entities = Object.values(await orm.getMetadata().getAll()).map(
    (entity) => entity.class,
  );

  // The FIRST time you set up a new testing database you'll get the following
  // error: `function uuid_generate_v4() does not exist`. This happens because
  // MikroORM doesn't track extensions. To get around this, uncomment the
  // following lines to get the extensions set up once. After that, you can
  // comment them out again to make your test suite run faster.

  // await orm.getSchemaGenerator().dropSchema();
  // await orm.getMigrator().up();

  // Ensure we're using the latest schema for this test run
  await orm.getSchemaGenerator().refreshDatabase();
  em = orm.em as EntityManager;
  dbCleaned = true;
};

beforeEach(async () => {
  await ensureCleanDb();
  em = em.fork() as EntityManager;

  // Clear the tables before each test
  await Promise.all(entities.map((entity) => em.qb(entity).truncate()));
  await em.flush();
});
