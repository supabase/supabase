import * as migration_20250619_155345 from './20250619_155345.ts';
import * as migration_20250619_160549 from './20250619_160549.ts';
import * as migration_20250808_145722_update_payload_migrations from './20250808_145722_update_payload_migrations.ts';

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
    name: '20250808_145722_update_payload_migrations'
  },
];
