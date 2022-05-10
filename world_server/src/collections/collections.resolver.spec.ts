import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { CollectionsResolver } from './collections.resolver';
import { UnprocessedCollection } from './unprocessedCollection.entity';
import 'test/db';
import axios from 'axios';

const baseCollection: Partial<UnprocessedCollection> = {
  contentHash: 'test',
  block: 'test',
  location: { coordinates: [1, 2], type: 'Point' },
  collectedAt: new Date(),
  uploaderIp: '4.4.4.4',
};

describe('CollectionsResolver', () => {
  it('Should start a new collection', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const resolver = moduleRef.get<CollectionsResolver>(CollectionsResolver);

    const signedUrl = await resolver.startCollectionUpload();

    // console.log(process.env);
    try {
      const resp = await axios.put(signedUrl, 'test');
      console.log(resp);
    } catch (e) {
      console.log(e);
    }
    // await axios.put(signedUrl, 'test body');
  });
});
