/**
 * TEMPORARY: pg-meta's catalog answers built from Spark's schema description, keyed by the
 * intent Studio sent. Same output shapes as pg-meta's SQL.
 *
 * Exit condition: Spark's `pg_catalog` runs pg-meta's SQL (D21 in the Spark PoC).
 */
import type { QueryIntent, QueryIntentArgs } from '@supabase/pg-meta'
import { DEFAULT_SYSTEM_SCHEMAS } from '@supabase/pg-meta/src/constants'

import type { SparkColumn, SparkDescription, SparkEnum, SparkTable, SparkView } from './client'

/** A stable synthetic oid: Studio keys tables, columns and constraints by oid. */
export const sparkOid = (key: string): number => {
  let hash = 0x811c9dc5
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 0x01000193) >>> 0
  return 16384 + (hash % 2_000_000_000)
}

const UDT: Readonly<Record<string, string>> = {
  bigint: 'int8',
  integer: 'int4',
  smallint: 'int2',
  boolean: 'bool',
  'double precision': 'float8',
  real: 'float4',
  'timestamp with time zone': 'timestamptz',
  'timestamp without time zone': 'timestamp',
  'time with time zone': 'timetz',
  'time without time zone': 'time',
  'character varying': 'varchar',
  character: 'bpchar',
  'bit varying': 'varbit',
}

export type TypeInfo = {
  data_type: string
  format: string
  format_schema: string
  enum: SparkEnum | undefined
  isArray: boolean
  base: string
}

export const typeInfo = (description: SparkDescription, type: string): TypeInfo => {
  const isArray = type.endsWith('[]')
  const inner = (isArray ? type.slice(0, -2) : type).replace(/\(.*?\)/, '').trim()
  const found = description.enums.find(
    (e) =>
      inner === `${e.schema}.${e.name}` ||
      (e.schema === 'public' && inner === e.name) ||
      inner === `"${e.schema}"."${e.name}"`
  )
  const udt = found === undefined ? (UDT[inner] ?? inner) : found.name
  return {
    data_type: isArray ? 'ARRAY' : found === undefined ? inner : 'USER-DEFINED',
    format: isArray ? `_${udt}` : udt,
    format_schema: found === undefined ? 'pg_catalog' : found.schema,
    enum: found,
    isArray,
    base: udt,
  }
}

const FK_ACTION: Readonly<Record<string, string>> = {
  'NO ACTION': 'a',
  RESTRICT: 'r',
  CASCADE: 'c',
  'SET NULL': 'n',
  'SET DEFAULT': 'd',
}

const fkAction = (def: string, on: 'DELETE' | 'UPDATE') => {
  const action = new RegExp(`ON ${on} (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)`, 'i').exec(
    def
  )?.[1]
  return action === undefined ? 'a' : (FK_ACTION[action.toUpperCase()] ?? 'a')
}

const indexColumns = (def: string): string[] => {
  const list = (/USING \w+ \((.*)\)\s*(?:INCLUDE|WHERE|$)/i.exec(def) ?? /\((.*)\)/.exec(def))?.[1]
  return list === undefined ? [] : list.split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
}

const POLICY_COMMAND: Readonly<Record<string, string>> = {
  r: 'SELECT',
  a: 'INSERT',
  w: 'UPDATE',
  d: 'DELETE',
  '*': 'ALL',
}

/** Roles Studio lists; Spark has no role catalog. */
const ROLES = [
  'postgres',
  'anon',
  'authenticated',
  'service_role',
  'supabase_admin',
  'authenticator',
  'supabase_auth_admin',
]
const API_ROLES = ['postgres', 'anon', 'authenticated', 'service_role']
const PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']

type Named = { schema: string; name: string }
type ForeignKey = {
  table: SparkTable
  constraint: SparkTable['constraints'][number]
  references: NonNullable<SparkTable['constraints'][number]['references']>
}

/** Keeps the schemas a pg-meta `list` builder's `filterByList` would keep. */
const inSchemas = (
  schema: string,
  {
    includeSystemSchemas,
    includedSchemas,
    excludedSchemas,
  }: { includeSystemSchemas?: boolean; includedSchemas?: string[]; excludedSchemas?: string[] }
) => {
  if (includedSchemas && includedSchemas.length > 0) return includedSchemas.includes(schema)
  if (excludedSchemas && excludedSchemas.includes(schema)) return false
  return includeSystemSchemas || !DEFAULT_SYSTEM_SCHEMAS.includes(schema)
}

const page = <T>(rows: T[], { limit, offset }: { limit?: number; offset?: number }) =>
  rows.slice(offset ?? 0, limit ? (offset ?? 0) + limit : undefined)

export const makeSparkModel = (description: SparkDescription) => {
  const tableId = (t: Named) => sparkOid(`${t.schema}.${t.name}`)
  const findTable = (schema: string, name: string) =>
    description.tables.find((t) => t.schema === schema && t.name === name)
  const tableById = (id: number) => description.tables.find((t) => tableId(t) === id)
  const viewById = (id: number) => description.views.find((v) => tableId(v) === id)

  const column = (t: SparkTable, c: SparkColumn) => {
    const info = typeInfo(description, c.type)
    const isUnique = t.constraints.some(
      (k) => k.type === 'u' && k.columns.length === 1 && k.columns[0] === c.name
    )
    const check = t.constraints.find(
      (k) => k.type === 'c' && k.columns.length === 1 && k.columns[0] === c.name
    )
    return {
      table_id: tableId(t),
      schema: t.schema,
      table: t.name,
      id: `${tableId(t)}.${c.position}`,
      ordinal_position: c.position,
      name: c.name,
      default_value: c.identity === null ? c.default : null,
      data_type: info.data_type,
      format: info.format,
      format_schema: info.format_schema,
      is_identity: c.identity !== null,
      identity_generation: c.identity === 'a' ? 'ALWAYS' : c.identity === 'd' ? 'BY DEFAULT' : null,
      is_generated: c.generated !== null && c.generated !== '',
      is_nullable: !c.not_null,
      is_updatable: true,
      is_unique: isUnique,
      check: check === undefined ? null : check.def.slice(7, -1),
      enums: info.enum?.labels ?? [],
      comment: c.comment,
    }
  }

  const foreignKeys: ForeignKey[] = description.tables.flatMap((table) =>
    table.constraints.flatMap((constraint) =>
      constraint.type === 'f' && constraint.references !== null
        ? [{ table, constraint, references: constraint.references }]
        : []
    )
  )

  const relationship = ({ table, constraint, references }: ForeignKey) => {
    const target = findTable(references.schema, references.table)
    return {
      id: sparkOid(`${table.schema}.${table.name}.${constraint.name}`),
      constraint_name: constraint.name,
      deletion_action: fkAction(constraint.def, 'DELETE'),
      update_action: fkAction(constraint.def, 'UPDATE'),
      source_id: tableId(table),
      source_schema: table.schema,
      source_table_name: table.name,
      source_column_name: constraint.columns[0],
      source_columns: constraint.columns,
      target_id:
        target === undefined
          ? sparkOid(`${references.schema}.${references.table}`)
          : tableId(target),
      target_table_schema: references.schema,
      target_table_name: references.table,
      target_column_name: references.columns[0],
      target_columns: references.columns,
    }
  }

  const table = (t: SparkTable, includeColumns = true) => ({
    id: tableId(t),
    schema: t.schema,
    name: t.name,
    rls_enabled: t.rls_enabled,
    rls_forced: t.rls_forced,
    replica_identity: 'DEFAULT' as const,
    bytes: 0,
    size: '0 bytes',
    live_rows_estimate: 0,
    dead_rows_estimate: 0,
    comment: t.comment,
    primary_keys: (t.constraints.find((k) => k.type === 'p')?.columns ?? []).map((name) => ({
      schema: t.schema,
      table_name: t.name,
      name,
      table_id: tableId(t),
    })),
    relationships: foreignKeys
      .filter(
        ({ table: source, references }) =>
          (source.schema === t.schema && source.name === t.name) ||
          (references.schema === t.schema && references.table === t.name)
      )
      .map(relationship),
    ...(includeColumns ? { columns: t.columns.map((c) => column(t, c)) } : {}),
  })

  const view = (v: SparkView) => ({
    id: tableId(v),
    schema: v.schema,
    name: v.name,
    is_updatable: false,
    comment: v.comment,
    columns: [],
  })

  const schemaNames = () => [
    ...new Set([
      ...description.schemas.map((s) => s.name),
      ...description.managed_schemas,
      'public',
    ]),
  ]

  return {
    description,
    tableId,
    findTable,
    tableById,
    viewById,
    column,
    table,
    view,
    relationship,
    foreignKeys,
    schemaNames,
  }
}

export type SparkModel = ReturnType<typeof makeSparkModel>

type CatalogAnswer<K extends keyof QueryIntentArgs> = (
  model: SparkModel,
  args: QueryIntentArgs[K]
) => unknown[]

const entityDefinition: CatalogAnswer<'entity.definition'> = (model, { id }) => {
  const target = model.tableById(id)
  if (target !== undefined) {
    const t = model.table(target)
    const unique_indexes = target.indexes
      .filter(
        (i) =>
          i.unique &&
          !(
            i.constraint !== null &&
            target.constraints.find((k) => k.name === i.constraint)?.type === 'p'
          )
      )
      .map((i) => ({
        schema: target.schema,
        table_name: target.name,
        table_id: t.id,
        columns: indexColumns(i.def),
      }))
    return [{ entity: { entity_type: 'r', ...t, unique_indexes } }]
  }
  const view = model.viewById(id)
  return view === undefined ? [] : [{ entity: { entity_type: 'v', ...model.view(view) } }]
}

const entities: CatalogAnswer<'entities.list'> = (model, args) => {
  const { schemas, search, sort, filterTypes, limit, page: pageIndex } = args
  // Spark has no partitions: a parent's partition list is empty.
  if (args.parentId !== undefined) return [{ data: { entities: [], count: 0 } }]
  const needle = search?.toLowerCase()
  const rows = [
    ...(filterTypes.includes('r')
      ? model.description.tables.map((t) => ({
          id: model.tableId(t),
          schema: t.schema,
          name: t.name,
          type: 'r',
          type_sort: 1,
          comment: t.comment,
          rls_enabled: t.rls_enabled,
          is_partition: false,
        }))
      : []),
    ...(filterTypes.includes('v')
      ? model.description.views.map((v) => ({
          id: model.tableId(v),
          schema: v.schema,
          name: v.name,
          type: 'v',
          type_sort: 2,
          comment: v.comment,
          rls_enabled: false,
          is_partition: false,
        }))
      : []),
  ]
    .filter((r) => schemas.includes(r.schema))
    .filter((r) => !needle || r.name.toLowerCase().includes(needle))
    .sort((a, b) =>
      sort === 'grouped-alphabetical' && a.type_sort !== b.type_sort
        ? a.type_sort - b.type_sort
        : a.name.localeCompare(b.name)
    )
    .map(({ type_sort: _, ...rest }) => rest)
  return [
    { data: { entities: page(rows, { limit, offset: pageIndex * limit }), count: rows.length } },
  ]
}

const tables: CatalogAnswer<'tables.list'> = (model, args) =>
  page(
    model.description.tables
      .filter((t) => inSchemas(t.schema, args))
      .map((t) => model.table(t, args.includeColumns ?? true))
      .sort((a, b) => a.id - b.id),
    args
  )

const tablesPaginated: CatalogAnswer<'tables.paginated'> = (model, args) => {
  const needle = args.nameFilter?.toLowerCase()
  return model.description.tables
    .filter((t) => (args.schema ? t.schema === args.schema : inSchemas(t.schema, {})))
    .filter(
      (t) =>
        !needle ||
        t.name.toLowerCase().includes(needle) ||
        (!args.schema && `${t.schema}.${t.name}`.toLowerCase().includes(needle))
    )
    .map((t) => model.table(t, args.includeColumns ?? false))
    .filter((t) => t.id > args.afterOid)
    .sort((a, b) => a.id - b.id)
    .slice(0, args.limit)
}

const tableRetrieve: CatalogAnswer<'tables.retrieve'> = (model, { id, name, schema }) => {
  const t =
    id !== undefined
      ? model.tableById(id)
      : name && schema
        ? model.findTable(schema, name)
        : undefined
  return t === undefined ? [] : [model.table(t)]
}

const views: CatalogAnswer<'views.list'> = (model, args) =>
  page(model.description.views.filter((v) => inSchemas(v.schema, args)).map(model.view), args)

const policies: CatalogAnswer<'policies.list'> = (model, args) =>
  page(
    model.description.tables
      .filter((t) => inSchemas(t.schema, args))
      .flatMap((t) =>
        t.policies.map((p) => ({
          id: sparkOid(`${t.schema}.${t.name}.policy.${p.name}`),
          schema: t.schema,
          table: t.name,
          table_id: model.tableId(t),
          name: p.name,
          action: p.permissive ? 'PERMISSIVE' : 'RESTRICTIVE',
          roles: p.roles.length > 0 ? p.roles : ['public'],
          command: POLICY_COMMAND[p.cmd] ?? p.cmd,
          definition: p.using,
          check: p.check,
        }))
      ),
    args
  )

const types: CatalogAnswer<'types.list'> = (model, args) =>
  page(
    model.description.enums
      .filter((e) => inSchemas(e.schema, args))
      .map((e) => ({
        id: sparkOid(`type.${e.schema}.${e.name}`),
        name: e.name,
        schema: e.schema,
        format: e.schema === 'public' ? e.name : `${e.schema}.${e.name}`,
        enums: e.labels,
        attributes: [],
        comment: e.comment,
      })),
    args
  )

const schemas: CatalogAnswer<'schemas.list'> = (model, args) =>
  page(
    model
      .schemaNames()
      .filter((name) => inSchemas(name, args))
      .map((name) => ({
        id: sparkOid(`schema.${name}`),
        name,
        owner: model.description.managed_schemas.includes(name) ? 'supabase_admin' : 'postgres',
        comment: model.description.schemas.find((s) => s.name === name)?.comment ?? null,
      })),
    args
  )

const tablePrivileges: CatalogAnswer<'table-privileges.list'> = (model, args) =>
  page(
    model.description.tables
      .filter((t) => inSchemas(t.schema, args))
      .map((t) => ({
        relation_id: model.tableId(t),
        schema: t.schema,
        name: t.name,
        kind: 'table',
        privileges: API_ROLES.flatMap((grantee) =>
          PRIVILEGES.map((privilege_type) => ({
            grantor: 'postgres',
            grantee,
            privilege_type,
            is_grantable: false,
          }))
        ),
      })),
    args
  )

const roles: CatalogAnswer<'roles.list'> = (_model, args) =>
  page(
    ROLES.map((name) => ({
      id: sparkOid(`role.${name}`),
      name,
      isSuperuser: name === 'postgres' || name === 'supabase_admin',
      canCreateDb: name === 'postgres',
      canCreateRole: name === 'postgres',
      inheritRole: true,
      canLogin: ['postgres', 'authenticator', 'supabase_admin', 'supabase_auth_admin'].includes(
        name
      ),
      isReplicationRole: false,
      canBypassRls: ['postgres', 'service_role', 'supabase_admin'].includes(name),
      activeConnections: 0,
      connectionLimit: 100,
      validUntil: null,
      config: {},
    })),
    args
  )

/** The realtime publication Studio expects to exist. */
const publications: CatalogAnswer<'publications.list'> = () => [
  {
    id: sparkOid('pub.supabase_realtime'),
    name: 'supabase_realtime',
    owner: 'postgres',
    publish_insert: true,
    publish_update: true,
    publish_delete: true,
    publish_truncate: true,
    tables: [],
  },
]

const foreignKeyConstraints: CatalogAnswer<'foreign-keys.list'> = (model, { schema }) =>
  model.foreignKeys
    .filter(({ table }) => table.schema === schema)
    .map((fk) => {
      const r = model.relationship(fk)
      return {
        id: r.id,
        constraint_name: r.constraint_name,
        deletion_action: r.deletion_action,
        update_action: r.update_action,
        source_id: r.source_id,
        source_schema: r.source_schema,
        source_table: r.source_table_name,
        source_columns: r.source_columns,
        target_id: r.target_id,
        target_schema: r.target_table_schema,
        target_table: r.target_table_name,
        target_columns: r.target_columns,
      }
    })

const tableConstraints: CatalogAnswer<'table-constraints.list'> = (model, { id }) => {
  const t = model.tableById(id)
  return t === undefined
    ? []
    : t.constraints.map((k) => ({
        id: sparkOid(`${t.schema}.${t.name}.${k.name}`),
        name: k.name,
        type: k.type,
      }))
}

const indexes: CatalogAnswer<'indexes.list'> = (model, { schema }) =>
  model.description.tables
    .filter((t) => t.schema === schema)
    .flatMap((t) =>
      t.indexes.map((i) => ({
        schema: t.schema,
        table: t.name,
        name: i.name,
        definition: i.def,
        columns: indexColumns(i.def).join(', '),
      }))
    )

/** Spark has none of these objects: an empty list is the true answer. */
const none = () => []

/**
 * Spark has no `ALTER DEFAULT PRIVILEGES`, but grants the API roles on every new table: the same
 * effect as Supabase's three default grants, which is what Studio checks for.
 */
const defaultPrivileges: CatalogAnswer<'default-privileges.state'> = () => [{ grant_count: 3 }]

const CATALOG: { [K in keyof QueryIntentArgs]?: CatalogAnswer<K> } = {
  'schemas.list': schemas,
  'tables.list': tables,
  'tables.retrieve': tableRetrieve,
  'tables.paginated': tablesPaginated,
  'views.list': views,
  'materialized-views.list': none,
  'foreign-tables.list': none,
  'policies.list': policies,
  'types.list': types,
  'publications.list': publications,
  'table-privileges.list': tablePrivileges,
  'roles.list': roles,
  'extensions.list': none,
  'event-triggers.list': none,
  'fdws.list': none,
  'foreign-keys.list': foreignKeyConstraints,
  'table-constraints.list': tableConstraints,
  'indexes.list': indexes,
  'default-privileges.state': defaultPrivileges,
  'entities.list': entities,
  'entity.definition': entityDefinition,
}

export const isCatalogIntent = (id: string): id is keyof typeof CATALOG => id in CATALOG

/** pg-meta's rows for a catalog intent, or `undefined` when the intent is not a catalog read. */
export function answerCatalogIntent(model: SparkModel, intent: QueryIntent): unknown[] | undefined {
  const answer = CATALOG[intent.id] as CatalogAnswer<typeof intent.id> | undefined
  return answer?.(model, intent.args as never)
}
