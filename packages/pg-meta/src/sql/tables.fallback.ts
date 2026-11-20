/**
 * TEMPORARY. Delete once Spark (turso) runs `tables.list`, `tables.retrieve` and
 * `getTablesPaginatedSql`, which fail there on `unnest` over two arrays, `DISTINCT ON` and the jsonb
 * aggregates.
 *
 * Reads the same facts with plain catalog queries (see `catalog-fallback.ts`). Facts a partial
 * catalog does not hold read as empty: sizes and row estimates are 0, enums are empty without
 * `pg_enum`, and pg-meta's privilege and temp-schema filters are not applied.
 */
import {
  optionalRows,
  toAttnums,
  toBool,
  toInt,
  toText,
  type CatalogQuery,
  type CatalogRow,
} from '../catalog-fallback'
import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { escapeIlikeLiteral, filterByList } from '../helpers'
import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../pg-format'
import type { PGColumn } from '../pg-meta-columns'
import type { PGTable, PGTableRelationship } from '../pg-meta-tables'

const idList = (ids: number[]) => joinSqlFragments(ids.map(literal), ', ')

const tablesSql = (where: SafeSqlFragment, tail: SafeSqlFragment = safeSql``) => safeSql`
select c.oid::int8 as id, n.nspname as schema, c.relname as name, c.relkind as kind,
  c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced,
  c.relreplident as replica_identity, obj_description(c.oid) as comment
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where ${where}
${tail}`

const attributesSql = (ids: number[]) => safeSql`
select a.attrelid::int8 as table_id, a.attnum as attnum, a.attname as name
from pg_catalog.pg_attribute a
where a.attrelid in (${idList(ids)}) and a.attnum > 0 and not a.attisdropped`

const foreignKeysSql = (ids: number[]) => safeSql`
select co.oid::int8 as id, co.conname as name,
  co.conrelid::int8 as source_id, sn.nspname as source_schema, sc.relname as source_table,
  co.confrelid::int8 as target_id, tn.nspname as target_schema, tc.relname as target_table,
  co.conkey::text as source_columns, co.confkey::text as target_columns,
  co.confdeltype as deletion_action, co.confupdtype as update_action
from pg_catalog.pg_constraint co
join pg_catalog.pg_class sc on sc.oid = co.conrelid
join pg_catalog.pg_namespace sn on sn.oid = sc.relnamespace
join pg_catalog.pg_class tc on tc.oid = co.confrelid
join pg_catalog.pg_namespace tn on tn.oid = tc.relnamespace
where co.contype = 'f' and (co.conrelid in (${idList(ids)}) or co.confrelid in (${idList(ids)}))
order by co.oid`

const indexesSql = (ids: number[]) => safeSql`
select i.indrelid::int8 as table_id, i.indkey::text as columns,
  i.indisprimary as is_primary, i.indisunique as is_unique
from pg_catalog.pg_index i
where i.indrelid in (${idList(ids)}) and i.indisunique`

const columnConstraintsSql = (ids: number[]) => safeSql`
select co.oid::int8 as id, co.contype as type, co.conrelid::int8 as table_id,
  co.conkey::text as columns, pg_get_constraintdef(co.oid, true) as definition
from pg_catalog.pg_constraint co
where co.conrelid in (${idList(ids)}) and co.contype in ('u', 'c')
order by co.oid`

const columnsSql = (ids: number[]) => safeSql`
select c.oid::int8 as table_id, c.relkind as kind, a.attnum as ordinal_position, a.attname as name,
  a.atthasdef as has_default, pg_get_expr(d.adbin, d.adrelid) as default_value,
  a.attnotnull as not_null, a.attidentity as identity, a.attgenerated as generated,
  t.oid::int8 as type_id, t.typname as type_name, t.typtype as type_type,
  t.typnotnull as type_not_null, t.typelem::int8 as type_elem, t.typlen as type_len,
  tn.nspname as type_schema, format_type(a.atttypid, null) as type_format,
  bt.oid::int8 as base_id, bt.typname as base_name, bt.typelem::int8 as base_elem,
  bt.typlen as base_len, bn.nspname as base_schema, format_type(t.typbasetype, null) as base_format,
  col_description(c.oid, a.attnum) as comment
from pg_catalog.pg_attribute a
join pg_catalog.pg_class c on c.oid = a.attrelid
join pg_catalog.pg_type t on t.oid = a.atttypid
join pg_catalog.pg_namespace tn on tn.oid = t.typnamespace
left join pg_catalog.pg_type bt on t.typtype = 'd' and bt.oid = t.typbasetype
left join pg_catalog.pg_namespace bn on bn.oid = bt.typnamespace
left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
where a.attrelid in (${idList(ids)}) and a.attnum > 0 and not a.attisdropped`

const ENUMS_SQL = safeSql`
select e.enumtypid::int8 as type_id, e.enumlabel as label
from pg_catalog.pg_enum e
order by e.enumsortorder`

const REPLICA_IDENTITY: Record<string, PGTable['replica_identity']> = {
  d: 'DEFAULT',
  i: 'INDEX',
  f: 'FULL',
}

export type FallbackTableRow = {
  id: number
  schema: string
  name: string
  kind: string
  rls_enabled: boolean
  rls_forced: boolean
  replica_identity: PGTable['replica_identity']
  comment: string | null
}

export type FallbackForeignKey = {
  id: number
  name: string
  sourceId: number
  sourceSchema: string
  sourceTable: string
  sourceColumns: string[]
  targetId: number
  targetSchema: string
  targetTable: string
  targetColumns: string[]
  deletionAction: string
  updateAction: string
}

export type RelationFacts = {
  primaryKeys: Map<number, string[]>
  /** Unique, non-primary indexes per table: their column names, one entry per distinct key. */
  uniqueIndexes: Map<number, string[][]>
  foreignKeys: FallbackForeignKey[]
  /** Columns per table in ordinal order; empty unless requested. */
  columns: Map<number, PGColumn[]>
}

export async function readTableRows(
  query: CatalogQuery,
  where: SafeSqlFragment,
  tail?: SafeSqlFragment
): Promise<FallbackTableRow[]> {
  const rows = await query(tablesSql(where, tail))
  return rows.map((row) => ({
    id: toInt(row.id),
    schema: String(row.schema),
    name: String(row.name),
    kind: String(row.kind),
    rls_enabled: toBool(row.rls_enabled),
    rls_forced: toBool(row.rls_forced),
    replica_identity: REPLICA_IDENTITY[String(row.replica_identity)] ?? 'NOTHING',
    comment: toText(row.comment),
  }))
}

function dataType(
  elem: number,
  len: number,
  schema: string | null,
  format: string | null,
  name: string | null
) {
  if (elem !== 0 && len === -1) return 'ARRAY'
  if (schema === 'pg_catalog') return format ?? name ?? 'USER-DEFINED'
  return 'USER-DEFINED'
}

// pg_get_constraintdef prints `CHECK (<expr>)`; pg-meta keeps `<expr>`.
const checkExpression = (definition: string | null) =>
  definition === null ? null : definition.slice(7, -1)

function buildColumns(
  tables: Map<number, { schema: string; name: string }>,
  rows: CatalogRow[],
  constraints: CatalogRow[],
  enums: CatalogRow[]
): Map<number, PGColumn[]> {
  const unique = new Set<string>()
  const check = new Map<string, string | null>()
  for (const row of constraints) {
    const keys = toAttnums(row.columns)
    if (keys.length !== 1) continue
    const key = `${toInt(row.table_id)}.${keys[0]}`
    if (row.type === 'u') unique.add(key)
    // pg-meta keeps the check with the lowest oid per column.
    if (row.type === 'c' && !check.has(key)) check.set(key, checkExpression(toText(row.definition)))
  }
  const labels = new Map<number, string[]>()
  for (const row of enums) {
    const id = toInt(row.type_id)
    labels.set(id, [...(labels.get(id) ?? []), String(row.label)])
  }

  const byTable = new Map<number, PGColumn[]>()
  for (const row of rows) {
    const tableId = toInt(row.table_id)
    const table = tables.get(tableId)
    if (!table) continue
    const position = toInt(row.ordinal_position)
    const key = `${tableId}.${position}`
    const isDomain = row.type_type === 'd'
    const identity = toText(row.identity)
    const kind = String(row.kind)
    const enumIds = [
      row.base_id ?? row.type_id,
      row.base_id !== null && row.base_id !== undefined ? row.base_elem : row.type_elem,
    ].map(toInt)
    const column: PGColumn = {
      table_id: tableId,
      schema: table.schema,
      table: table.name,
      id: key,
      ordinal_position: position,
      name: String(row.name),
      default_value: toBool(row.has_default) ? toText(row.default_value) : null,
      data_type: isDomain
        ? dataType(
            toInt(row.base_elem),
            toInt(row.base_len),
            toText(row.base_schema),
            toText(row.base_format),
            toText(row.base_name)
          )
        : dataType(
            toInt(row.type_elem),
            toInt(row.type_len),
            toText(row.type_schema),
            toText(row.type_format),
            toText(row.type_name)
          ),
      format: String(row.base_name ?? row.type_name),
      format_schema: String(row.base_schema ?? row.type_schema),
      is_identity: identity === 'a' || identity === 'd',
      identity_generation: identity === 'a' ? 'ALWAYS' : identity === 'd' ? 'BY DEFAULT' : null,
      is_generated: toText(row.generated) === 's',
      is_nullable: !(toBool(row.not_null) || (isDomain && toBool(row.type_not_null))),
      // turso has no pg_column_is_updatable: view and foreign table columns read as not updatable.
      is_updatable: kind === 'r' || kind === 'p',
      is_unique: unique.has(key),
      check: check.get(key) ?? null,
      enums: enumIds.flatMap((id) => labels.get(id) ?? []),
      comment: toText(row.comment),
    }
    byTable.set(tableId, [...(byTable.get(tableId) ?? []), column])
  }
  for (const list of byTable.values()) list.sort((a, b) => a.ordinal_position - b.ordinal_position)
  return byTable
}

/** pg-meta's columns of the given relations, in ordinal order per relation id. */
export async function readColumns(
  query: CatalogQuery,
  relations: { id: number; schema: string; name: string }[]
): Promise<Map<number, PGColumn[]>> {
  const ids = relations.map((relation) => relation.id)
  if (ids.length === 0) return new Map()
  const [columnRows, constraintRows, enumRows] = await Promise.all([
    query(columnsSql(ids)),
    query(columnConstraintsSql(ids)),
    optionalRows(query(ENUMS_SQL)),
  ])
  return buildColumns(
    new Map(relations.map((relation) => [relation.id, relation])),
    columnRows,
    constraintRows,
    enumRows
  )
}

/** Keys, foreign keys and (optionally) columns of the given tables. */
export async function readRelationFacts(
  query: CatalogQuery,
  tables: FallbackTableRow[],
  { includeColumns }: { includeColumns: boolean }
): Promise<RelationFacts> {
  const ids = tables.map((table) => table.id)
  if (ids.length === 0) {
    return { primaryKeys: new Map(), uniqueIndexes: new Map(), foreignKeys: [], columns: new Map() }
  }
  const [fkRows, indexRows, columns] = await Promise.all([
    query(foreignKeysSql(ids)),
    query(indexesSql(ids)),
    includeColumns ? readColumns(query, tables) : new Map<number, PGColumn[]>(),
  ])

  const attnameIds = [
    ...new Set([...ids, ...fkRows.flatMap((row) => [toInt(row.source_id), toInt(row.target_id)])]),
  ]
  const attname = new Map(
    (await query(attributesSql(attnameIds))).map((row) => [
      `${toInt(row.table_id)}.${toInt(row.attnum)}`,
      String(row.name),
    ])
  )
  const names = (tableId: number, attnums: number[]) =>
    attnums.flatMap((n) => attname.get(`${tableId}.${n}`) ?? [])

  const primaryKeys = new Map<number, string[]>()
  // pg-meta groups unique indexes by their key: indexes on the same columns read as one entry that
  // lists each column once per index.
  const uniqueKeys = new Map<string, { tableId: number; columns: string[]; count: number }>()
  for (const row of indexRows) {
    const tableId = toInt(row.table_id)
    const columns = names(tableId, toAttnums(row.columns))
    if (toBool(row.is_primary)) {
      primaryKeys.set(tableId, columns)
      continue
    }
    if (columns.length === 0) continue
    const key = `${tableId}:${String(row.columns)}`
    const entry = uniqueKeys.get(key) ?? { tableId, columns, count: 0 }
    uniqueKeys.set(key, { ...entry, count: entry.count + 1 })
  }
  const uniqueIndexes = new Map<number, string[][]>()
  for (const { tableId, columns, count } of uniqueKeys.values()) {
    const repeated = columns.flatMap((column) => Array<string>(count).fill(column))
    uniqueIndexes.set(tableId, [...(uniqueIndexes.get(tableId) ?? []), repeated])
  }

  const foreignKeys = fkRows.map((row) => ({
    id: toInt(row.id),
    name: String(row.name),
    sourceId: toInt(row.source_id),
    sourceSchema: String(row.source_schema),
    sourceTable: String(row.source_table),
    sourceColumns: names(toInt(row.source_id), toAttnums(row.source_columns)),
    targetId: toInt(row.target_id),
    targetSchema: String(row.target_schema),
    targetTable: String(row.target_table),
    targetColumns: names(toInt(row.target_id), toAttnums(row.target_columns)),
    deletionAction: String(row.deletion_action),
    updateAction: String(row.update_action),
  }))

  return { primaryKeys, uniqueIndexes, foreignKeys, columns }
}

/** One relationship per column pair, as pg-meta pairs `conkey` and `confkey` by position. */
function pairedRelationships(fk: FallbackForeignKey): PGTableRelationship[] {
  return fk.sourceColumns.map((sourceColumn, index) => ({
    id: fk.id,
    constraint_name: fk.name,
    source_schema: fk.sourceSchema,
    source_table_name: fk.sourceTable,
    source_column_name: sourceColumn,
    target_table_schema: fk.targetSchema,
    target_table_name: fk.targetTable,
    target_column_name: fk.targetColumns[index] ?? '',
  }))
}

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

function toPGTable(
  table: FallbackTableRow,
  facts: RelationFacts,
  relationships: PGTableRelationship[],
  includeColumns: boolean
): PGTable {
  return {
    id: table.id,
    schema: table.schema,
    name: table.name,
    rls_enabled: table.rls_enabled,
    rls_forced: table.rls_forced,
    replica_identity: table.replica_identity,
    bytes: 0,
    size: '0 bytes',
    live_rows_estimate: 0,
    dead_rows_estimate: 0,
    comment: table.comment,
    primary_keys: (facts.primaryKeys.get(table.id) ?? []).map((name) => ({
      table_id: table.id,
      schema: table.schema,
      table_name: table.name,
      name,
    })),
    relationships,
    ...(includeColumns && { columns: facts.columns.get(table.id) ?? [] }),
  }
}

const TABLE_KINDS = safeSql`c.relkind in ('r', 'p')`

/** Fallback for `tables.list`. */
export async function listTablesFallback(
  query: CatalogQuery,
  {
    includeSystemSchemas = false,
    includedSchemas,
    excludedSchemas,
    limit,
    offset,
    includeColumns = true,
  }: {
    includeSystemSchemas?: boolean
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
    includeColumns?: boolean
  } = {}
): Promise<PGTable[]> {
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  const tail = safeSql`${limit ? safeSql`limit ${literal(limit)}` : safeSql``} ${offset ? safeSql`offset ${literal(offset)}` : safeSql``}`
  const tables = await readTableRows(
    query,
    filter ? safeSql`${TABLE_KINDS} and n.nspname ${filter}` : TABLE_KINDS,
    tail
  )
  const facts = await readRelationFacts(query, tables, { includeColumns })
  return tables.map((table) =>
    toPGTable(
      table,
      facts,
      facts.foreignKeys
        .filter((fk) => fk.sourceId === table.id || fk.targetId === table.id)
        .flatMap(pairedRelationships),
      includeColumns
    )
  )
}

/** Fallback for `tables.retrieve`; resolves to `undefined` when no table matches. */
export async function retrieveTableFallback(
  query: CatalogQuery,
  identifier: { id: number } | { name: string; schema: string }
): Promise<PGTable | undefined> {
  const where =
    'id' in identifier
      ? safeSql`c.oid = ${literal(identifier.id)}`
      : safeSql`c.relname = ${literal(identifier.name)} and n.nspname = ${literal(identifier.schema)}`
  const [table] = await readTableRows(query, safeSql`${TABLE_KINDS} and ${where}`)
  if (!table) return undefined
  const facts = await readRelationFacts(query, [table], { includeColumns: true })
  const relationships = facts.foreignKeys
    .flatMap(pairedRelationships)
    .sort(
      (a, b) =>
        compareText(a.constraint_name, b.constraint_name) ||
        compareText(a.source_column_name, b.source_column_name) ||
        compareText(a.target_column_name, b.target_column_name)
    )
  return toPGTable(table, facts, relationships, true)
}

/** Fallback for `getTablesPaginatedSql`. */
export async function listTablesPaginatedFallback(
  query: CatalogQuery,
  {
    schema,
    includeColumns = false,
    limit,
    afterOid,
    nameFilter,
  }: {
    schema?: string
    includeColumns?: boolean
    limit: number
    afterOid: number
    nameFilter?: string
  }
): Promise<PGTable[]> {
  const filter = filterByList(
    schema ? [schema] : undefined,
    undefined,
    schema ? undefined : DEFAULT_SYSTEM_SCHEMAS
  )
  const pattern = nameFilter ? literal(`%${escapeIlikeLiteral(nameFilter)}%`) : undefined
  const nameClause =
    pattern === undefined
      ? safeSql``
      : schema
        ? safeSql`and c.relname ilike ${pattern}`
        : safeSql`and (c.relname ilike ${pattern} or n.nspname ilike ${pattern} or (n.nspname || '.' || c.relname) ilike ${pattern})`
  const tables = await readTableRows(
    query,
    safeSql`${TABLE_KINDS} and c.oid > ${literal(afterOid)} ${filter ? safeSql`and n.nspname ${filter}` : safeSql``} ${nameClause}`,
    safeSql`order by c.oid limit ${literal(limit)}`
  )
  const facts = await readRelationFacts(query, tables, { includeColumns })
  return tables.map((table) =>
    toPGTable(
      table,
      facts,
      facts.foreignKeys
        .filter(
          (fk) => fk.sourceId === table.id || (fk.targetId === table.id && fk.sourceId !== table.id)
        )
        .flatMap(pairedRelationships),
      includeColumns
    )
  )
}
