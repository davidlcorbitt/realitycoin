import { Injectable } from '@nestjs/common';
import * as S3 from 'aws-sdk/clients/s3';

@Injectable()
export class StorjService {
  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.STORJ_ACCESS_KEY,
      secretAccessKey: process.env.STORJ_SECRET_KEY,
      endpoint: process.env.STORJ_ENDPOINT,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      httpOptions: { connectTimeout: 0, timeout: 0 },
    });

    this.s3;
  }

  public s3: S3;
  public bucket: string = process.env.STORJ_BUCKET;
}
