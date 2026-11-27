/**
 * TEMPORARY. Delete once Spark (turso) runs `views.list`, `materializedViews.list` and
 * `foreignTables.list`, which fail there on `DISTINCT ON`.
 *
 * Plain reads of `pg_class` by relkind. turso's `pg_class` lists no views, so on Spark these read as
 * empty; view updatability reads as false without `pg_relation_is_updatable`.
 */
import { toBool, toInt, toText, type CatalogQuery, type CatalogRow } from '../catalog-fallback'
import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { filterByList } from '../helpers'
import { literal, safeSql, type SafeSqlFragment } from '../pg-format'
import { readColumns } from './tables.fallback'

type ListOptions = {
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  limit?: number
  offset?: number
  includeColumns?: boolean
}

async function listRelations<T>(
  query: CatalogQuery,
  {
    includeSystemSchemas = false,
    includedSchemas,
    excludedSchemas,
    limit,
    offset,
    includeColumns = true,
  }: ListOptions,
  select: SafeSqlFragment,
  build: (row: CatalogRow) => T
) {
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  const rows = await query(safeSql`
    ${select} ${filter ? safeSql`and n.nspname ${filter}` : safeSql``}
    ${limit ? safeSql`limit ${literal(limit)}` : safeSql``}
    ${offset ? safeSql`offset ${literal(offset)}` : safeSql``}`)
  const relations = rows.map((row) => ({
    id: toInt(row.id),
    schema: String(row.schema),
    name: String(row.name),
  }))
  const columns = includeColumns ? await readColumns(query, relations) : undefined
  return rows.map((row) => ({
    ...build(row),
    ...(columns && { columns: columns.get(toInt(row.id)) ?? [] }),
  }))
}

const base = (row: CatalogRow) => ({
  id: toInt(row.id),
  schema: String(row.schema),
  name: String(row.name),
})

/** Fallback for `views.list`. */
export const listViewsFallback = (query: CatalogQuery, options: ListOptions = {}) =>
  listRelations(
    query,
    options,
    safeSql`
      select c.oid::int8 as id, n.nspname as schema, c.relname as name, obj_description(c.oid) as comment
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where c.relkind = 'v'`,
    (row) => ({ ...base(row), is_updatable: false, comment: toText(row.comment) })
  )

/** Fallback for `materializedViews.list`. */
export const listMaterializedViewsFallback = (query: CatalogQuery, options: ListOptions = {}) =>
  listRelations(
    query,
    options,
    safeSql`
      select c.oid::int8 as id, n.nspname as schema, c.relname as name,
        c.relispopulated as is_populated, obj_description(c.oid) as comment
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where c.relkind = 'm'`,
    (row) => ({
      ...base(row),
      is_populated: toBool(row.is_populated),
      comment: toText(row.comment),
    })
  )

/** Fallback for `foreignTables.list`. */
export const listForeignTablesFallback = (query: CatalogQuery, options: ListOptions = {}) =>
  listRelations(
    query,
    options,
    safeSql`
      select c.oid::int8 as id, n.nspname as schema, c.relname as name, obj_description(c.oid) as comment,
        fs.srvname as foreign_server_name, fdw.fdwname as foreign_data_wrapper_name,
        handler.proname as foreign_data_wrapper_handler
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      join pg_catalog.pg_foreign_table ft on ft.ftrelid = c.oid
      join pg_catalog.pg_foreign_server fs on fs.oid = ft.ftserver
      join pg_catalog.pg_foreign_data_wrapper fdw on fdw.oid = fs.srvfdw
      join pg_catalog.pg_proc handler on handler.oid = fdw.fdwhandler
      where c.relkind = 'f'`,
    (row) => ({
      ...base(row),
      comment: toText(row.comment),
      foreign_server_name: String(row.foreign_server_name),
      foreign_data_wrapper_name: String(row.foreign_data_wrapper_name),
      foreign_data_wrapper_handler: String(row.foreign_data_wrapper_handler),
    })
  )
