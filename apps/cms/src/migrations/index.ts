import * as migration_20250619_155345 from './20250619_155345';
import * as migration_20250619_160549 from './20250619_160549';

export const migrations = [
  {
    up: migration_20250619_155345.up,
    down: migration_20250619_155345.down,
    name: '20250619_155345',
  },
  {
    up: migration_20250619_160549.up,
    down: migration_20250619_160549.down,
    name: '20250619_160549'
  },
];
