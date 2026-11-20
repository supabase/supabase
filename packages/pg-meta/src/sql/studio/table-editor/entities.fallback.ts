/**
 * TEMPORARY. Delete once Spark (turso) runs `getEntityTypesSQL`, which fails there on `jsonb_agg`
 * with `ORDER BY`.
 *
 * The same select without the jsonb wrapping, assembled in TypeScript. pg-meta's privilege and
 * temp-schema filters are not applied.
 */
import { toBool, toInt, toText, type CatalogQuery } from '../../../catalog-fallback'
import { joinSqlFragments, literal, safeSql } from '../../../pg-format'
import type { getEntityTypesSQL } from './entities'

/** Fallback for `getEntityTypesSQL`: the same single row, `[{ data: { entities, count } }]`. */
export async function getEntityTypesFallback(
  query: CatalogQuery,
  {
    schemas,
    search,
    sort,
    filterTypes,
    excludePartitions = false,
    parentId,
    limit,
    page,
  }: Parameters<typeof getEntityTypesSQL>[0]
) {
  const orderBy =
    sort === 'alphabetical' ? safeSql`c.relname asc` : safeSql`type_sort asc, c.relname asc`
  const schemaClause =
    parentId !== undefined
      ? safeSql``
      : safeSql`and nc.nspname in (${joinSqlFragments(schemas.map(literal), ', ')})`
  const searchClause = search ? safeSql`and c.relname ilike ${literal(`%${search}%`)}` : safeSql``
  const partitionClause = excludePartitions ? safeSql`and not c.relispartition` : safeSql``
  const parentClause =
    parentId !== undefined
      ? safeSql`and c.oid in (select inhrelid from pg_catalog.pg_inherits where inhparent = ${literal(parentId)})`
      : safeSql``

  const rows = await query(safeSql`
    select
      c.oid::int8 as id,
      nc.nspname as schema,
      c.relname as name,
      c.relkind as type,
      case c.relkind when 'r' then 1 when 'v' then 2 when 'm' then 3 when 'f' then 4 when 'p' then 5 end as type_sort,
      obj_description(c.oid) as comment,
      count(*) over() as count,
      c.relrowsecurity as rls_enabled,
      c.relispartition as is_partition
    from pg_catalog.pg_namespace nc
    join pg_catalog.pg_class c on nc.oid = c.relnamespace
    where c.relkind in (${joinSqlFragments(filterTypes.map(literal), ', ')})
      ${schemaClause}
      ${searchClause}
      ${partitionClause}
      ${parentClause}
    order by ${orderBy}
    limit ${literal(limit)}
    offset ${literal(page * limit)}
  `)

  return [
    {
      data: {
        entities: rows.map((row) => ({
          id: toInt(row.id),
          schema: String(row.schema),
          name: String(row.name),
          type: String(row.type),
          comment: toText(row.comment),
          rls_enabled: toBool(row.rls_enabled),
          is_partition: toBool(row.is_partition),
        })),
        count: rows.length === 0 ? 0 : toInt(rows[0].count),
      },
    },
  ]
}
