import * as migration_20250526_130524 from './20250526_130524';

export const migrations = [
  {
    up: migration_20250526_130524.up,
    down: migration_20250526_130524.down,
    name: '20250526_130524'
  },
];
