/**
 * TEMPORARY. Delete once Spark (turso) has `pg_enum` and runs `types.list`.
 *
 * Enum labels read as empty without `pg_enum`.
 */
import { optionalRows, toInt, toText, type CatalogQuery } from '../catalog-fallback'
import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { filterByList } from '../helpers'
import { joinSqlFragments, literal, safeSql } from '../pg-format'

/** Fallback for `types.list`. */
export async function listTypesFallback(
  query: CatalogQuery,
  {
    includeArrayTypes = false,
    includeSystemSchemas = false,
    includedSchemas,
    excludedSchemas,
    limit,
    offset = 0,
  }: {
    includeArrayTypes?: boolean
    includeSystemSchemas?: boolean
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
  } = {}
) {
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  const [rows, arrayTypes] = await Promise.all([
    query(safeSql`
      select t.oid::int8 as id, t.typname as name, n.nspname as schema,
        format_type(t.oid, null) as format, t.typrelid::int8 as relid, t.typelem::int8 as elem,
        c.relkind as relkind, obj_description(t.oid, 'pg_type') as comment
      from pg_catalog.pg_type t
      left join pg_catalog.pg_namespace n on n.oid = t.typnamespace
      left join pg_catalog.pg_class c on c.oid = t.typrelid
      ${filter ? safeSql`where n.nspname ${filter}` : safeSql``}
      order by t.oid`),
    query(
      safeSql`select t.oid::int8 as id, t.typarray::int8 as array_id from pg_catalog.pg_type t`
    ),
  ])
  const arrayOf = new Map(arrayTypes.map((row) => [toInt(row.id), toInt(row.array_id)]))
  const types = rows
    .filter((row) => toInt(row.relid) === 0 || row.relkind === 'c')
    .filter((row) => includeArrayTypes || arrayOf.get(toInt(row.elem)) !== toInt(row.id))
    .slice(offset, limit ? offset + limit : undefined)

  const ids = types.map((row) => toInt(row.id))
  const relids = types.map((row) => toInt(row.relid)).filter((id) => id !== 0)
  const [enums, attributes] = await Promise.all([
    ids.length === 0
      ? []
      : optionalRows(
          query(safeSql`
            select e.enumtypid::int8 as type_id, e.enumlabel as label
            from pg_catalog.pg_enum e
            where e.enumtypid in (${joinSqlFragments(ids.map(literal), ', ')})
            order by e.enumsortorder`)
        ),
    relids.length === 0
      ? []
      : query(safeSql`
          select a.attrelid::int8 as relid, a.attname as name, a.atttypid::int8 as type_id
          from pg_catalog.pg_attribute a
          where a.attrelid in (${joinSqlFragments(relids.map(literal), ', ')}) and not a.attisdropped
          order by a.attnum`),
  ])

  return types.map((row) => ({
    id: toInt(row.id),
    name: String(row.name),
    schema: String(row.schema),
    format: String(row.format),
    enums: enums.filter((e) => toInt(e.type_id) === toInt(row.id)).map((e) => String(e.label)),
    attributes: attributes
      .filter((a) => toInt(a.relid) === toInt(row.relid))
      .map((a) => ({ name: String(a.name), type_id: toInt(a.type_id) })),
    comment: toText(row.comment),
  }))
}
