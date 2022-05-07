import { EntityManager } from '@mikro-orm/postgresql';
import { Query, Resolver } from '@nestjs/graphql';
import { User } from './user.entity';

@Resolver()
export class UserResolver {
  constructor(private readonly em: EntityManager) {}

  @Query(() => String)
  async hello() {
    const user = await this.em.findOne(User, '1');
    console.log({ user });

    return 'Hello World!';
  }
}
