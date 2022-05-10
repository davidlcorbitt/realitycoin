import { em } from 'test/db';
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

    await em.persistAndFlush(unprocessedCollection);
    await em.clear();

    const newCollection = await em.findOne(
      UnprocessedCollection,
      unprocessedCollection.id,
    );

    expect(newCollection?.location.coordinates).toEqual([1, 2]);
  });
});
