import { Migration } from '@mikro-orm/migrations';

export class Migration20220507101420 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
    CREATE EXTENSION postgis;
    -- enable raster support (for 3+)
    CREATE EXTENSION postgis_raster;
    -- Enable Topology
    CREATE EXTENSION postgis_topology;
    -- Enable PostGIS Advanced 3D
    -- and other geoprocessing algorithms
    -- sfcgal not available with all distributions
    CREATE EXTENSION postgis_sfcgal;
    -- fuzzy matching needed for Tiger
    CREATE EXTENSION fuzzystrmatch;
    -- rule based standardizer
    CREATE EXTENSION address_standardizer;
    -- example rule data set
    CREATE EXTENSION address_standardizer_data_us;
    -- Enable US Tiger Geocoder
    CREATE EXTENSION postgis_tiger_geocoder;

    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    this.addSql(
      'create table "user" ("id" uuid not null default uuid_generate_v4(), "email" varchar(255) not null, "display_name" varchar(255) not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now());',
    );
    this.addSql(
      'alter table "user" add constraint "user_pkey" primary key ("id");',
    );

    this.addSql(
      'create table "unprocessed_collection" ("id" uuid not null default uuid_generate_v4(), "content_hash" varchar(255) not null, "block" varchar(255) not null, "location" GEOGRAPHY(POINT) not null, "miner_id" uuid not null, "status" text check ("status" in (\'REQUESTED\', \'QUEUED\', \'PROCESSING\', \'ACCEPTED\', \'REJECTED\')) not null, "rejected_reason" varchar(255) not null, "collected_at" timestamptz(0) not null, "created_at" smallint not null, "updated_at" timestamptz(0) not null default now());',
    );
    this.addSql(
      'create index "unprocessed_collection_block_index" on "unprocessed_collection" ("block");',
    );
    this.addSql(
      'create index "unprocessed_collection_created_at_index" on "unprocessed_collection" ("created_at");',
    );
    this.addSql(
      'create index "unprocessed_collection_location_index" on "unprocessed_collection" using GIST ("location");',
    );
    this.addSql(
      'alter table "unprocessed_collection" add constraint "unprocessed_collection_pkey" primary key ("id");',
    );

    this.addSql(
      'create table "collection" ("id" uuid not null default uuid_generate_v4(), "content_hash" varchar(255) not null, "location" GEOGRAPHY(POINT) not null, "block" varchar(255) not null, "miner_id" uuid not null, "unprocessed_collection_id" uuid not null, "collected_at" timestamptz(0) not null, "uploaded_at" timestamptz(0) not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now());',
    );
    this.addSql(
      'create index "collection_block_index" on "collection" ("block");',
    );
    this.addSql(
      'alter table "collection" add constraint "collection_unprocessed_collection_id_unique" unique ("unprocessed_collection_id");',
    );
    this.addSql(
      'create index "collection_created_at_index" on "collection" ("created_at");',
    );
    this.addSql(
      'create index "collection_location_index" on "collection" using GIST ("location");',
    );
    this.addSql(
      'alter table "collection" add constraint "collection_pkey" primary key ("id");',
    );

    this.addSql(
      'create table "block" ("id" varchar(255) not null, "owner_id" uuid not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now());',
    );
    this.addSql('create index "block_owner_id_index" on "block" ("owner_id");');
    this.addSql(
      'alter table "block" add constraint "block_pkey" primary key ("id");',
    );

    this.addSql(
      'alter table "unprocessed_collection" add constraint "unprocessed_collection_miner_id_foreign" foreign key ("miner_id") references "user" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "collection" add constraint "collection_miner_id_foreign" foreign key ("miner_id") references "user" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "collection" add constraint "collection_unprocessed_collection_id_foreign" foreign key ("unprocessed_collection_id") references "unprocessed_collection" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "block" add constraint "block_owner_id_foreign" foreign key ("owner_id") references "user" ("id") on update cascade;',
    );
  }
}
