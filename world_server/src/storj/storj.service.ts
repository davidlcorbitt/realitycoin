import { Injectable } from '@nestjs/common';
import S3, { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class StorjService {
  constructor() {
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: process.env.STORJ_ACCESS_KEY,
        secretAccessKey: process.env.STORJ_SECRET_KEY,
      },
      endpoint: process.env.STORJ_ENDPOINT,
      forcePathStyle: true,
      region: 'us-east-1',
    });
  }

  public s3: S3Client;
  public bucket: string = process.env.STORJ_BUCKET;
}
