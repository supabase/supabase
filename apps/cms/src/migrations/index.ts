import * as migration_20250529_103319 from './20250529_103319';

export const migrations = [
  {
    up: migration_20250529_103319.up,
    down: migration_20250529_103319.down,
    name: '20250529_103319'
  },
];
