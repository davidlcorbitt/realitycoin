import { Module } from '@nestjs/common';
import { StorjService } from 'src/storj/storj.service';
import { CollectionsResolver } from './collections.resolver';

@Module({
  providers: [CollectionsResolver],
})
export class CollectionsModule {}
