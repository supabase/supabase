import * as migration_20250529_103319 from './20250529_103319';
import * as migration_20250613_134829 from './20250613_134829';

export const migrations = [
  {
    up: migration_20250529_103319.up,
    down: migration_20250529_103319.down,
    name: '20250529_103319',
  },
  {
    up: migration_20250613_134829.up,
    down: migration_20250613_134829.down,
    name: '20250613_134829'
  },
];
