import { UseRequestContext } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test } from '@nestjs/testing';
import config from 'mikro-orm.config';
import { UnprocessedCollection } from './unprocessedCollection.entity';

const baseCollection: Partial<UnprocessedCollection> = {
  contentHash: 'test',
  block: 'test',
  location: { coordinates: [1, 2], type: 'Point' },
  collectedAt: new Date(),
  uploaderIp: '4.4.4.4',
};

describe('UnprocessedCollectionEntity', () => {
  it('Should round-trip a point', async () => {
    const unprocessedCollection = new UnprocessedCollection(baseCollection);
    unprocessedCollection.location = { coordinates: [1, 2], type: 'Point' };

    // TODO: extract this
    const moduleRef = await Test.createTestingModule({
      imports: [MikroOrmModule.forRoot(config)],
    }).compile();

    const em = moduleRef.get<EntityManager>(EntityManager).fork();

    await em.persistAndFlush(unprocessedCollection);
    await em.clear();

    const newCollection = await em.findOne(
      UnprocessedCollection,
      unprocessedCollection.id,
    );

    expect(newCollection?.location.coordinates).toEqual([1, 2]);
  });
});
