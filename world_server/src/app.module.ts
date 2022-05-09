import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CollectionsModule } from './collections/collections.module';
import { StorjService } from './storj/storj.service';
import config from '../mikro-orm.config';

@Global()
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    MikroOrmModule.forRoot(config),
    UsersModule,
    CollectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, StorjService],
  exports: [StorjService],
})
export class AppModule {}
