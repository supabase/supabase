import * as migration_20250529_092205 from './20250529_092205';

export const migrations = [
  {
    up: migration_20250529_092205.up,
    down: migration_20250529_092205.down,
    name: '20250529_092205'
  },
];
