import type { SafePostgresColumn, SafePostgresTable } from '@/lib/postgres-types'

export const importTable: SafePostgresTable = {
  id: 1,
  name: 'imports',
  schema: 'public',
  rls_enabled: false,
  rls_forced: false,
  replica_identity: 'DEFAULT',
  bytes: 0,
  size: '0 bytes',
  live_rows_estimate: 0,
  dead_rows_estimate: 0,
  comment: null,
  primary_keys: [],
  relationships: [],
  columns: [],
}

export const identityColumn: SafePostgresColumn = {
  id: '1.1',
  table_id: 1,
  schema: 'public',
  table: 'imports',
  name: 'id',
  ordinal_position: 1,
  data_type: 'integer',
  format: 'int4',
  is_identity: true,
  identity_generation: 'BY DEFAULT',
  is_generated: false,
  is_nullable: false,
  is_updatable: true,
  is_unique: false,
  check: null,
  default_value: null,
  enums: [],
  comment: null,
}
