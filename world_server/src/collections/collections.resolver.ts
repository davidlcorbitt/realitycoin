import { EntityManager } from '@mikro-orm/postgresql';
import { Global } from '@nestjs/common';
import { Mutation, Resolver } from '@nestjs/graphql';
import { StorjService } from 'src/storj/storj.service';
import { UnprocessedCollection } from './unprocessedCollection.entity';

@Resolver()
@Global()
export class CollectionsResolver {
  constructor(
    private readonly em: EntityManager,
    private readonly storj: StorjService,
  ) {}

  @Mutation(() => String)
  async startCollectionUpload() {
    const collection = new UnprocessedCollection({
      contentHash: 'test',
      block: 'test',
      location: [1, 2],
      // location: "(-71.060316 48.432044), 4326)",
      collectedAt: new Date(),
      uploaderIp: 'test',
    });

    const buckets = await this.storj.s3.listBuckets().promise();
    console.log(buckets.Buckets);

    // this.em.getRepository(UnprocessedCollection).save(collection);
    await this.em.persistAndFlush(collection);
    const repo = this.em.getRepository(UnprocessedCollection);
    console.log({ collection });

    const id = collection.id;

    // this.storj.bucket.g;
    return 'Hello World! ' + JSON.stringify(collection);
  }
}
