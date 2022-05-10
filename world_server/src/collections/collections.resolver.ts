import { ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
      location: { type: 'Point', coordinates: [1, 2] },
      collectedAt: new Date(),
      uploaderIp: 'test',
    });

    await this.em.persistAndFlush(collection);

    const signedUrl = await getSignedUrl(
      this.storj.s3,
      new PutObjectCommand({
        Bucket: this.storj.bucket,
        Key: collection.storjPath(),
      }),
      { expiresIn: 3600 * 3 },
    );

    console.log({ signedUrl });

    return signedUrl;
  }
}
