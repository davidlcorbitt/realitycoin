import { Migration } from '@mikro-orm/migrations';

export class Migration20220507082923 extends Migration {
  async up(): Promise<void> {
    this.addSql('create table "user" ("id" varchar(255) not null);');
    this.addSql(
      'alter table "user" add constraint "user_pkey" primary key ("id");',
    );
  }
}
