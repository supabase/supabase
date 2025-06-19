import * as migration_20250613_100000 from './20250613_100000';
import * as migration_20250613_134829 from './20250613_134829';

export const migrations = [
  {
    up: migration_20250613_100000.up,
    down: migration_20250613_100000.down,
    name: '20250613_100000'
  },
  {
    up: migration_20250613_134829.up,
    down: migration_20250613_134829.down,
    name: '20250613_134829',
  },
];
