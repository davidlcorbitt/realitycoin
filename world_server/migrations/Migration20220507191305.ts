import { Migration } from '@mikro-orm/migrations';

export class Migration20220507191305 extends Migration {
  async up(): Promise<void> {
    // Initial migration to add the extensions we use.
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

      -- Enable UUIDs
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
  }
}
