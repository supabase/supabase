import * as migration_20250619_155345 from './20250619_155345';
import * as migration_20250619_160549 from './20250619_160549';
import * as migration_20250808_145722_update_payload_migrations from './20250808_145722_update_payload_migrations';
import * as migration_20250819_222013_update_authors from './20250819_222013_update_authors';
import * as migration_20250821_151248 from './20250821_151248';
import * as migration_20250821_165446 from './20250821_165446';
import * as migration_20250902_112449 from './20250902_112449';

export const migrations = [
  {
    up: migration_20250619_155345.up,
    down: migration_20250619_155345.down,
    name: '20250619_155345',
  },
  {
    up: migration_20250619_160549.up,
    down: migration_20250619_160549.down,
    name: '20250619_160549',
  },
  {
    up: migration_20250808_145722_update_payload_migrations.up,
    down: migration_20250808_145722_update_payload_migrations.down,
    name: '20250808_145722_update_payload_migrations',
  },
  {
    up: migration_20250819_222013_update_authors.up,
    down: migration_20250819_222013_update_authors.down,
    name: '20250819_222013_update_authors',
  },
  {
    up: migration_20250821_151248.up,
    down: migration_20250821_151248.down,
    name: '20250821_151248',
  },
  {
    up: migration_20250821_165446.up,
    down: migration_20250821_165446.down,
    name: '20250821_165446',
  },
  {
    up: migration_20250902_112449.up,
    down: migration_20250902_112449.down,
    name: '20250902_112449'
  },
];
