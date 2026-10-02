import { Static, Type } from '@sinclair/typebox'
import { DatabaseError } from 'pg-protocol'
import type { Options as PrettierOptions } from 'prettier'
import { PoolConfig as PgPoolConfig } from 'pg'

export interface FormatterOptions extends PrettierOptions {}

export interface PostgresMetaOk<T> {
  data: T
  error: null
}

export interface PostgresMetaErr {
  data: null
  error: Partial<DatabaseError> & { message: string; formattedError?: string }
}

export type PostgresMetaResult<T> = PostgresMetaOk<T> | PostgresMetaErr

export const postgresColumnSchema = Type.Object({
  table_id: Type.Integer(),
  schema: Type.String(),
  table: Type.String(),
  id: Type.RegExp(/^(\d+)\.(\d+)$/),
  ordinal_position: Type.Integer(),
  name: Type.String(),
  default_value: Type.Unknown(),
  data_type: Type.String(),
  format: Type.String(),
  is_identity: Type.Boolean(),
  identity_generation: Type.Union([
    Type.Literal('ALWAYS'),
    Type.Literal('BY DEFAULT'),
    Type.Null(),
  ]),
  is_generated: Type.Boolean(),
  is_nullable: Type.Boolean(),
  is_updatable: Type.Boolean(),
  is_unique: Type.Boolean(),
  enums: Type.Array(Type.String()),
  check: Type.Union([Type.String(), Type.Null()]),
  comment: Type.Union([Type.String(), Type.Null()]),
})
export type PostgresColumn = Static<typeof postgresColumnSchema>

export const postgresColumnCreateSchema = Type.Object({
  table_id: Type.Integer(),
  name: Type.String(),
  type: Type.String(),
  default_value: Type.Optional(Type.Unknown()),
  default_value_format: Type.Optional(
    Type.Union([Type.Literal('expression'), Type.Literal('literal')])
  ),
  is_identity: Type.Optional(Type.Boolean()),
  identity_generation: Type.Optional(
    Type.Union([Type.Literal('BY DEFAULT'), Type.Literal('ALWAYS')])
  ),
  is_nullable: Type.Optional(Type.Boolean()),
  is_primary_key: Type.Optional(Type.Boolean()),
  is_unique: Type.Optional(Type.Boolean()),
  comment: Type.Optional(Type.String()),
  check: Type.Optional(Type.String()),
})
export type PostgresColumnCreate = Static<typeof postgresColumnCreateSchema>

export const postgresColumnUpdateSchema = Type.Object({
  name: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  drop_default: Type.Optional(Type.Boolean()),
  default_value: Type.Optional(Type.Unknown()),
  default_value_format: Type.Optional(
    Type.Union([Type.Literal('expression'), Type.Literal('literal')])
  ),
  is_identity: Type.Optional(Type.Boolean()),
  identity_generation: Type.Optional(
    Type.Union([Type.Literal('BY DEFAULT'), Type.Literal('ALWAYS')])
  ),
  is_nullable: Type.Optional(Type.Boolean()),
  is_unique: Type.Optional(Type.Boolean()),
  comment: Type.Optional(Type.String()),
  check: Type.Optional(
    Type.Union(
      // Type.Null() must go first: https://github.com/sinclairzx81/typebox/issues/546
      [Type.Null(), Type.String()]
    )
  ),
})
export type PostgresColumnUpdate = Static<typeof postgresColumnUpdateSchema>

// TODO Rethink config.sql
export const postgresConfigSchema = Type.Object({
  name: Type.Unknown(),
  setting: Type.Unknown(),
  category: Type.Unknown(),
  group: Type.Unknown(),
  subgroup: Type.Unknown(),
  unit: Type.Unknown(),
  short_desc: Type.Unknown(),
  extra_desc: Type.Unknown(),
  context: Type.Unknown(),
  vartype: Type.Unknown(),
  source: Type.Unknown(),
  min_val: Type.Unknown(),
  max_val: Type.Unknown(),
  enumvals: Type.Unknown(),
  boot_val: Type.Unknown(),
  reset_val: Type.Unknown(),
  sourcefile: Type.Unknown(),
  sourceline: Type.Unknown(),
  pending_restart: Type.Unknown(),
})
export type PostgresConfig = Static<typeof postgresConfigSchema>

export const postgresExtensionSchema = Type.Object({
  name: Type.String(),
  schema: Type.Union([Type.String(), Type.Null()]),
  default_version: Type.String(),
  installed_version: Type.Union([Type.String(), Type.Null()]),
  comment: Type.Union([Type.String(), Type.Null()]),
})
export type PostgresExtension = Static<typeof postgresExtensionSchema>

export const postgresForeignTableSchema = Type.Object({
  id: Type.Integer(),
  schema: Type.String(),
  name: Type.String(),
  comment: Type.Union([Type.String(), Type.Null()]),
  columns: Type.Optional(Type.Array(postgresColumnSchema)),
})
export type PostgresForeignTable = Static<typeof postgresForeignTableSchema>

const postgresFunctionSchema = Type.Object({
  id: Type.Integer(),
  schema: Type.String(),
  name: Type.String(),
  language: Type.String(),
  definition: Type.String(),
  complete_statement: Type.String(),
  args: Type.Array(
    Type.Object({
      mode: Type.Union([
        Type.Literal('in'),
        Type.Literal('out'),
        Type.Literal('inout'),
        Type.Literal('variadic'),
        Type.Literal('table'),
      ]),
      name: Type.String(),
      type_id: Type.Number(),
      has_default: Type.Boolean(),
    })
  ),
  argument_types: Type.String(),
  identity_argument_types: Type.String(),
  return_type_id: Type.Integer(),
  return_type: Type.String(),
  return_type_relation_id: Type.Union([Type.Integer(), Type.Null()]),
  is_set_returning_function: Type.Boolean(),
  prorows: Type.Union([Type.Number(), Type.Null()]),
  behavior: Type.Union([
    Type.Literal('IMMUTABLE'),
    Type.Literal('STABLE'),
    Type.Literal('VOLATILE'),
  ]),
  security_definer: Type.Boolean(),
  config_params: Type.Union([Type.Record(Type.String(), Type.String()), Type.Null()]),
})
export type PostgresFunction = Static<typeof postgresFunctionSchema>

export const postgresFunctionCreateFunction = Type.Object({
  name: Type.String(),
  definition: Type.String(),
  args: Type.Optional(Type.Array(Type.String())),
  behavior: Type.Optional(
    Type.Union([Type.Literal('IMMUTABLE'), Type.Literal('STABLE'), Type.Literal('VOLATILE')])
  ),
  config_params: Type.Optional(Type.Record(Type.String(), Type.String())),
  schema: Type.Optional(Type.String()),
  language: Type.Optional(Type.String()),
  return_type: Type.Optional(Type.String()),
  security_definer: Type.Optional(Type.Boolean()),
})
export type PostgresFunctionCreate = Static<typeof postgresFunctionCreateFunction>

const postgresIndexSchema = Type.Object({
  id: Type.Integer(),
  table_id: Type.Integer(),
  schema: Type.String(),
  number_of_attributes: Type.Integer(),
  number_of_key_attributes: Type.Integer(),
  is_unique: Type.Boolean(),
  is_primary: Type.Boolean(),
  is_exclusion: Type.Boolean(),
  is_immediate: Type.Boolean(),
  is_clustered: Type.Boolean(),
  is_valid: Type.Boolean(),
  check_xmin: Type.Boolean(),
  is_ready: Type.Boolean(),
  is_live: Type.Boolean(),
  is_replica_identity: Type.Boolean(),
  key_attributes: Type.Array(Type.Number()),
  collation: Type.Array(Type.Number()),
  class: Type.Array(Type.Number()),
  options: Type.Array(Type.Number()),
  index_predicate: Type.Union([Type.String(), Type.Null()]),
  comment: Type.Union([Type.String(), Type.Null()]),
  index_definition: Type.String(),
  access_method: Type.String(),
  index_attributes: Type.Array(
    Type.Object({
      attribute_number: Type.Number(),
      attribute_name: Type.String(),
      data_type: Type.String(),
    })
  ),
})
export type PostgresIndex = Static<typeof postgresIndexSchema>

export const postgresPolicySchema = Type.Object({
  id: Type.Integer(),
  schema: Type.String(),
  table: Type.String(),
  table_id: Type.Integer(),
  name: Type.String(),
  action: Type.Union([Type.Literal('PERMISSIVE'), Type.Literal('RESTRICTIVE')]),
  roles: Type.Array(Type.String()),
  command: Type.Union([
    Type.Literal('SELECT'),
    Type.Literal('INSERT'),
    Type.Literal('UPDATE'),
    Type.Literal('DELETE'),
    Type.Literal('ALL'),
  ]),
  definition: Type.Union([Type.String(), Type.Null()]),
  check: Type.Union([Type.String(), Type.Null()]),
})
export type PostgresPolicy = Static<typeof postgresPolicySchema>

export const postgresPrimaryKeySchema = Type.Object({
  schema: Type.String(),
  table_name: Type.String(),
  name: Type.String(),
  table_id: Type.Integer(),
})
export type PostgresPrimaryKey = Static<typeof postgresPrimaryKeySchema>

export const postgresPublicationSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  owner: Type.String(),
  publish_insert: Type.Boolean(),
  publish_update: Type.Boolean(),
  publish_delete: Type.Boolean(),
  publish_truncate: Type.Boolean(),
  tables: Type.Union([
    Type.Array(Type.Object({ id: Type.Integer(), name: Type.String(), schema: Type.String() })),
    Type.Null(),
  ]),
})
export type PostgresPublication = Static<typeof postgresPublicationSchema>

export const postgresRelationshipOldSchema = Type.Object({
  id: Type.Integer(),
  constraint_name: Type.String(),
  source_schema: Type.String(),
  source_table_name: Type.String(),
  source_column_name: Type.String(),
  target_table_schema: Type.String(),
  target_table_name: Type.String(),
  target_column_name: Type.String(),
})
export const postgresRelationshipSchema = Type.Object({
  foreign_key_name: Type.String(),
  schema: Type.String(),
  relation: Type.String(),
  columns: Type.Array(Type.String()),
  is_one_to_one: Type.Boolean(),
  referenced_schema: Type.String(),
  referenced_relation: Type.String(),
  referenced_columns: Type.Array(Type.String()),
})
export type PostgresRelationship = Static<typeof postgresRelationshipSchema>

export const PostgresMetaRoleConfigSchema = Type.Object({
  op: Type.Union([Type.Literal('remove'), Type.Literal('add'), Type.Literal('replace')]),
  path: Type.String(),
  value: Type.Optional(Type.String()),
})
export type PostgresMetaRoleConfig = Static<typeof PostgresMetaRoleConfigSchema>

export const postgresRoleSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  is_superuser: Type.Boolean(),
  can_create_db: Type.Boolean(),
  can_create_role: Type.Boolean(),
  inherit_role: Type.Boolean(),
  can_login: Type.Boolean(),
  is_replication_role: Type.Boolean(),
  can_bypass_rls: Type.Boolean(),
  active_connections: Type.Integer(),
  connection_limit: Type.Integer(),
  password: Type.String(),
  valid_until: Type.Union([Type.String(), Type.Null()]),
  config: Type.Union([Type.String(), Type.Null(), Type.Record(Type.String(), Type.String())]),
})
export type PostgresRole = Static<typeof postgresRoleSchema>

export const postgresRoleCreateSchema = Type.Object({
  name: Type.String(),
  password: Type.Optional(Type.String()),
  inherit_role: Type.Optional(Type.Boolean()),
  can_login: Type.Optional(Type.Boolean()),
  is_superuser: Type.Optional(Type.Boolean()),
  can_create_db: Type.Optional(Type.Boolean()),
  can_create_role: Type.Optional(Type.Boolean()),
  is_replication_role: Type.Optional(Type.Boolean()),
  can_bypass_rls: Type.Optional(Type.Boolean()),
  connection_limit: Type.Optional(Type.Integer()),
  member_of: Type.Optional(Type.Array(Type.String())),
  members: Type.Optional(Type.Array(Type.String())),
  admins: Type.Optional(Type.Array(Type.String())),
  valid_until: Type.Optional(Type.String()),
  config: Type.Optional(Type.Record(Type.String(), Type.String())),
})
export type PostgresRoleCreate = Static<typeof postgresRoleCreateSchema>

export const postgresRoleUpdateSchema = Type.Object({
  name: Type.Optional(Type.String()),
  password: Type.Optional(Type.String()),
  inherit_role: Type.Optional(Type.Boolean()),
  can_login: Type.Optional(Type.Boolean()),
  is_superuser: Type.Optional(Type.Boolean()),
  can_create_db: Type.Optional(Type.Boolean()),
  can_create_role: Type.Optional(Type.Boolean()),
  is_replication_role: Type.Optional(Type.Boolean()),
  can_bypass_rls: Type.Optional(Type.Boolean()),
  connection_limit: Type.Optional(Type.Integer()),
  valid_until: Type.Optional(Type.String()),
  config: Type.Optional(Type.Array(PostgresMetaRoleConfigSchema)),
})
export type PostgresRoleUpdate = Static<typeof postgresRoleUpdateSchema>

export const postgresSchemaSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  owner: Type.String(),
})
export type PostgresSchema = Static<typeof postgresSchemaSchema>

export const postgresSchemaCreateSchema = Type.Object({
  name: Type.String(),
  owner: Type.Optional(Type.String()),
})
export type PostgresSchemaCreate = Static<typeof postgresSchemaCreateSchema>

export const postgresSchemaUpdateSchema = Type.Object({
  name: Type.Optional(Type.String()),
  owner: Type.Optional(Type.String()),
})
export type PostgresSchemaUpdate = Static<typeof postgresSchemaUpdateSchema>

export const postgresTableSchema = Type.Object({
  id: Type.Integer(),
  schema: Type.String(),
  name: Type.String(),
  rls_enabled: Type.Boolean(),
  rls_forced: Type.Boolean(),
  replica_identity: Type.Union([
    Type.Literal('DEFAULT'),
    Type.Literal('INDEX'),
    Type.Literal('FULL'),
    Type.Literal('NOTHING'),
  ]),
  bytes: Type.Integer(),
  size: Type.String(),
  live_rows_estimate: Type.Integer(),
  dead_rows_estimate: Type.Integer(),
  comment: Type.Union([Type.String(), Type.Null()]),
  columns: Type.Optional(Type.Array(postgresColumnSchema)),
  primary_keys: Type.Array(postgresPrimaryKeySchema),
  relationships: Type.Array(postgresRelationshipOldSchema),
})
export type PostgresTable = Static<typeof postgresTableSchema>

export const postgresTableCreateSchema = Type.Object({
  name: Type.String(),
  schema: Type.Optional(Type.String()),
  comment: Type.Optional(Type.String()),
})
export type PostgresTableCreate = Static<typeof postgresTableCreateSchema>

export const postgresTableUpdateSchema = Type.Object({
  name: Type.Optional(Type.String()),
  schema: Type.Optional(Type.String()),
  rls_enabled: Type.Optional(Type.Boolean()),
  rls_forced: Type.Optional(Type.Boolean()),
  replica_identity: Type.Optional(
    Type.Union([
      Type.Literal('DEFAULT'),
      Type.Literal('INDEX'),
      Type.Literal('FULL'),
      Type.Literal('NOTHING'),
    ])
  ),
  replica_identity_index: Type.Optional(Type.String()),
  primary_keys: Type.Optional(Type.Array(Type.Object({ name: Type.String() }))),
  comment: Type.Optional(Type.String()),
})
export type PostgresTableUpdate = Static<typeof postgresTableUpdateSchema>

export const postgresTriggerSchema = Type.Object({
  id: Type.Integer(),
  table_id: Type.Integer(),
  enabled_mode: Type.Union([
    Type.Literal('ORIGIN'),
    Type.Literal('REPLICA'),
    Type.Literal('ALWAYS'),
    Type.Literal('DISABLED'),
  ]),
  name: Type.String(),
  table: Type.String(),
  schema: Type.String(),
  condition: Type.Union([Type.String(), Type.Null()]),
  orientation: Type.Union([Type.Literal('ROW'), Type.Literal('STATEMENT')]),
  activation: Type.Union([
    Type.Literal('BEFORE'),
    Type.Literal('AFTER'),
    Type.Literal('INSTEAD OF'),
  ]),
  events: Type.Array(Type.String()),
  function_schema: Type.String(),
  function_name: Type.String(),
  function_args: Type.Array(Type.String()),
})
export type PostgresTrigger = Static<typeof postgresTriggerSchema>

export const postgresTypeSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  schema: Type.String(),
  format: Type.String(),
  enums: Type.Array(Type.String()),
  attributes: Type.Array(Type.Object({ name: Type.String(), type_id: Type.Integer() })),
  comment: Type.Union([Type.String(), Type.Null()]),
  type_relation_id: Type.Union([Type.Integer(), Type.Null()]),
})
export type PostgresType = Static<typeof postgresTypeSchema>

export const postgresVersionSchema = Type.Object({
  version: Type.String(),
  version_number: Type.Integer(),
  active_connections: Type.Integer(),
  max_connections: Type.Integer(),
})
export type PostgresVersion = Static<typeof postgresVersionSchema>

export const postgresViewSchema = Type.Object({
  id: Type.Integer(),
  schema: Type.String(),
  name: Type.String(),
  is_updatable: Type.Boolean(),
  comment: Type.Union([Type.String(), Type.Null()]),
  columns: Type.Optional(Type.Array(postgresColumnSchema)),
})
export type PostgresView = Static<typeof postgresViewSchema>

export const postgresMaterializedViewSchema = Type.Object({
  id: Type.Integer(),
  schema: Type.String(),
  name: Type.String(),
  is_populated: Type.Boolean(),
  comment: Type.Union([Type.String(), Type.Null()]),
  columns: Type.Optional(Type.Array(postgresColumnSchema)),
})
export type PostgresMaterializedView = Static<typeof postgresMaterializedViewSchema>

export const postgresTablePrivilegesSchema = Type.Object({
  relation_id: Type.Integer(),
  schema: Type.String(),
  name: Type.String(),
  kind: Type.Union([
    Type.Literal('table'),
    Type.Literal('view'),
    Type.Literal('materialized_view'),
    Type.Literal('foreign_table'),
    Type.Literal('partitioned_table'),
  ]),
  privileges: Type.Array(
    Type.Object({
      grantor: Type.String(),
      grantee: Type.String(),
      privilege_type: Type.Union([
        Type.Literal('SELECT'),
        Type.Literal('INSERT'),
        Type.Literal('UPDATE'),
        Type.Literal('DELETE'),
        Type.Literal('TRUNCATE'),
        Type.Literal('REFERENCES'),
        Type.Literal('TRIGGER'),
        Type.Literal('MAINTAIN'),
      ]),
      is_grantable: Type.Boolean(),
    })
  ),
})
export type PostgresTablePrivileges = Static<typeof postgresTablePrivilegesSchema>

export const postgresTablePrivilegesGrantSchema = Type.Object({
  relation_id: Type.Integer(),
  grantee: Type.String(),
  privilege_type: Type.Union([
    Type.Literal('ALL'),
    Type.Literal('SELECT'),
    Type.Literal('INSERT'),
    Type.Literal('UPDATE'),
    Type.Literal('DELETE'),
    Type.Literal('TRUNCATE'),
    Type.Literal('REFERENCES'),
    Type.Literal('TRIGGER'),
    Type.Literal('MAINTAIN'),
  ]),
  is_grantable: Type.Optional(Type.Boolean()),
})
export type PostgresTablePrivilegesGrant = Static<typeof postgresTablePrivilegesGrantSchema>

export const postgresTablePrivilegesRevokeSchema = Type.Object({
  relation_id: Type.Integer(),
  grantee: Type.String(),
  privilege_type: Type.Union([
    Type.Literal('ALL'),
    Type.Literal('SELECT'),
    Type.Literal('INSERT'),
    Type.Literal('UPDATE'),
    Type.Literal('DELETE'),
    Type.Literal('TRUNCATE'),
    Type.Literal('REFERENCES'),
    Type.Literal('TRIGGER'),
    Type.Literal('MAINTAIN'),
  ]),
})
export type PostgresTablePrivilegesRevoke = Static<typeof postgresTablePrivilegesRevokeSchema>

export const postgresColumnPrivilegesSchema = Type.Object({
  column_id: Type.RegExp(/^(\d+)\.(\d+)$/),
  relation_schema: Type.String(),
  relation_name: Type.String(),
  column_name: Type.String(),
  privileges: Type.Array(
    Type.Object({
      grantor: Type.String(),
      grantee: Type.String(),
      privilege_type: Type.Union([
        Type.Literal('SELECT'),
        Type.Literal('INSERT'),
        Type.Literal('UPDATE'),
        Type.Literal('REFERENCES'),
      ]),
      is_grantable: Type.Boolean(),
    })
  ),
})
export type PostgresColumnPrivileges = Static<typeof postgresColumnPrivilegesSchema>

export const postgresColumnPrivilegesGrantSchema = Type.Object({
  column_id: Type.RegExp(/^(\d+)\.(\d+)$/),
  grantee: Type.String(),
  privilege_type: Type.Union([
    Type.Literal('ALL'),
    Type.Literal('SELECT'),
    Type.Literal('INSERT'),
    Type.Literal('UPDATE'),
    Type.Literal('REFERENCES'),
  ]),
  is_grantable: Type.Optional(Type.Boolean()),
})
export type PostgresColumnPrivilegesGrant = Static<typeof postgresColumnPrivilegesGrantSchema>

export const postgresColumnPrivilegesRevokeSchema = Type.Object({
  column_id: Type.RegExp(/^(\d+)\.(\d+)$/),
  grantee: Type.String(),
  privilege_type: Type.Union([
    Type.Literal('ALL'),
    Type.Literal('SELECT'),
    Type.Literal('INSERT'),
    Type.Literal('UPDATE'),
    Type.Literal('REFERENCES'),
  ]),
})
export type PostgresColumnPrivilegesRevoke = Static<typeof postgresColumnPrivilegesRevokeSchema>

export interface PoolConfig extends PgPoolConfig {
  maxResultSize?: number
}
