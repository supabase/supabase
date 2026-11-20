/**
 * TEMPORARY. Delete once Spark (turso) runs `getTableColumnsSql`, which fails there on `json_agg`
 * of a whole row.
 *
 * pg-meta's privilege filters are not applied. turso's `format_type` reports an array column as its
 * element type.
 */
import { toInt, type CatalogQuery } from '../../../catalog-fallback'
import { joinSqlFragments, literal, safeSql } from '../../../pg-format'

/** Fallback for `getTableColumnsSql`. */
export async function getTableColumnsFallback(
  query: CatalogQuery,
  { table, schema }: { table?: string; schema?: string }
) {
  const relations = await query(safeSql`
    select c.oid::int8 as id, n.nspname as schemaname, c.relname as tablename,
      quote_ident(n.nspname) || '.' || quote_ident(c.relname) as quoted_name, c.relkind as kind
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'v', 'm')
      and n.nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
      and n.nspname not like 'pg_temp_%'
      and n.nspname not like 'pg_toast_temp_%'
      ${table ? safeSql`and c.relname = ${literal(table)}` : safeSql``}
      ${schema ? safeSql`and n.nspname = ${literal(schema)}` : safeSql``}`)
  const ids = relations.map((row) => toInt(row.id))
  const attributes =
    ids.length === 0
      ? []
      : await query(safeSql`
          select a.attrelid::int8 as attrelid, a.attname, format_type(a.atttypid, a.atttypmod) as data_type,
            a.attnum, a.attisdropped
          from pg_catalog.pg_attribute a
          where a.attrelid in (${joinSqlFragments(ids.map(literal), ', ')})
            and a.attnum > 0 and not a.attisdropped`)
  return relations.map((row) => {
    const columns = attributes
      .filter((attribute) => toInt(attribute.attrelid) === toInt(row.id))
      .map((attribute) => ({
        // Postgres's json renders an oid as a string.
        attrelid: String(toInt(attribute.attrelid)),
        attname: String(attribute.attname),
        data_type: String(attribute.data_type),
        attnum: toInt(attribute.attnum),
        attisdropped: false,
      }))
    return {
      schemaname: String(row.schemaname),
      tablename: String(row.tablename),
      quoted_name: String(row.quoted_name),
      is_table: row.kind === 'r',
      columns: columns.length > 0 ? columns : [null],
    }
  })
}
