import * as migration_20250528_142500 from './20250528_142500';

export const migrations = [
  {
    up: migration_20250528_142500.up,
    down: migration_20250528_142500.down,
    name: '20250528_142500',
  },
];
