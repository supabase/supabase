/**
 * TEMPORARY. Delete once Spark (turso) runs `getFDWsSql`, which fails there on `jsonb_agg`.
 *
 * Spark has no foreign data wrappers, so it lists none.
 */
import { toInt, type CatalogQuery } from '../../../catalog-fallback'
import { safeSql } from '../../../pg-format'

const texts = (value: unknown) => (Array.isArray(value) ? value.map(String) : null)

/** Fallback for `getFDWsSql`. */
export async function getFDWsFallback(query: CatalogQuery) {
  const [servers, tables, columns] = await Promise.all([
    query(safeSql`
      select s.oid::int8 as id, w.fdwname as name, s.srvname as server_name,
        s.srvoptions as server_options, c.proname as handler
      from pg_catalog.pg_foreign_server s
      join pg_catalog.pg_foreign_data_wrapper w on s.srvfdw = w.oid
      join pg_catalog.pg_proc c on w.fdwhandler = c.oid`),
    query(safeSql`
      select t.ftserver::int8 as server_id, c.oid::int8 as id, n.nspname as schema, c.relname as name,
        t.ftoptions as options
      from pg_catalog.pg_foreign_table t
      join pg_catalog.pg_class c on c.oid = t.ftrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace`),
    query(safeSql`
      select a.attrelid::int8 as table_id, a.attname as name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as type
      from pg_catalog.pg_attribute a
      join pg_catalog.pg_foreign_table t on t.ftrelid = a.attrelid
      where a.attnum > 0 and not a.attisdropped
      order by a.attnum`),
  ])
  return servers.map((server) => {
    const serverTables = tables
      .filter((table) => toInt(table.server_id) === toInt(server.id))
      .map((table) => {
        const tableColumns = columns
          .filter((column) => toInt(column.table_id) === toInt(table.id))
          .map((column) => ({ name: String(column.name), type: String(column.type) }))
        return {
          id: toInt(table.id),
          schema: String(table.schema),
          name: String(table.name),
          columns: tableColumns.length > 0 ? tableColumns : null,
          options: texts(table.options),
        }
      })
    return {
      id: toInt(server.id),
      name: String(server.name),
      server_name: String(server.server_name),
      server_options: texts(server.server_options),
      handler: String(server.handler),
      tables: serverTables.length > 0 ? serverTables : null,
    }
  })
}
