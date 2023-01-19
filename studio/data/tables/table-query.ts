import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'

// columns
// SELECT
//   c.oid::int8 AS table_id,
//   nc.nspname AS schema,
//   c.relname AS table,
//   (c.oid || '.' || a.attnum) AS id,
//   a.attnum AS ordinal_position,
//   a.attname AS name,
//   CASE
//     WHEN a.atthasdef THEN pg_get_expr(ad.adbin, ad.adrelid)
//     ELSE NULL
//   END AS default_value,
//   CASE
//     WHEN t.typtype = 'd' THEN CASE
//       WHEN bt.typelem <> 0 :: oid
//       AND bt.typlen = -1 THEN 'ARRAY'
//       WHEN nbt.nspname = 'pg_catalog' THEN format_type(t.typbasetype, NULL)
//       ELSE 'USER-DEFINED'
//     END
//     ELSE CASE
//       WHEN t.typelem <> 0 :: oid
//       AND t.typlen = -1 THEN 'ARRAY'
//       WHEN nt.nspname = 'pg_catalog' THEN format_type(a.atttypid, NULL)
//       ELSE 'USER-DEFINED'
//     END
//   END AS data_type,
//   COALESCE(bt.typname, t.typname) AS format,
//   a.attidentity IN ('a', 'd') AS is_identity,
//   CASE
//     a.attidentity
//     WHEN 'a' THEN 'ALWAYS'
//     WHEN 'd' THEN 'BY DEFAULT'
//     ELSE NULL
//   END AS identity_generation,
//   a.attgenerated IN ('s') AS is_generated,
//   NOT (
//     a.attnotnull
//     OR t.typtype = 'd' AND t.typnotnull
//   ) AS is_nullable,
//   (
//     c.relkind IN ('r', 'p')
//     OR c.relkind IN ('v', 'f') AND pg_column_is_updatable(c.oid, a.attnum, FALSE)
//   ) AS is_updatable,
//   uniques.table_id IS NOT NULL AS is_unique,
//   array_to_json(
//     array(
//       SELECT
//         enumlabel
//       FROM
//         pg_catalog.pg_enum enums
//       WHERE
//         enums.enumtypid = coalesce(bt.oid, t.oid)
//         OR enums.enumtypid = coalesce(bt.typelem, t.typelem)
//       ORDER BY
//         enums.enumsortorder
//     )
//   ) AS enums,
//   col_description(c.oid, a.attnum) AS comment
// FROM
//   pg_attribute a
//   LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid
//   AND a.attnum = ad.adnum
//   JOIN (
//     pg_class c
//     JOIN pg_namespace nc ON c.relnamespace = nc.oid
//   ) ON a.attrelid = c.oid
//   JOIN (
//     pg_type t
//     JOIN pg_namespace nt ON t.typnamespace = nt.oid
//   ) ON a.atttypid = t.oid
//   LEFT JOIN (
//     pg_type bt
//     JOIN pg_namespace nbt ON bt.typnamespace = nbt.oid
//   ) ON t.typtype = 'd'
//   AND t.typbasetype = bt.oid
//   LEFT JOIN (
//     SELECT
//       conrelid AS table_id,
//       conkey[1] AS ordinal_position
//     FROM pg_catalog.pg_constraint
//     WHERE contype = 'u' AND cardinality(conkey) = 1
//   ) AS uniques ON uniques.table_id = c.oid AND uniques.ordinal_position = a.attnum
// WHERE
//   NOT pg_is_other_temp_schema(nc.oid)
//   AND a.attnum > 0
//   AND NOT a.attisdropped
//   AND (c.relkind IN ('r', 'v', 'f', 'p'))
//   AND (
//     pg_has_role(c.relowner, 'USAGE')
//     OR has_column_privilege(
//       c.oid,
//       a.attnum,
//       'SELECT, INSERT, UPDATE, REFERENCES'
//     )
//   )
//   and c.oid = 27004;

export const getTableSql = ({ id }: { id?: string }) => {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = /* SQL */ `
    select
      c.oid::int8 AS "id",
      nc.nspname AS "schema",
      c.relname AS "name",
      case c.relkind
        when 'r' then 'table'
        when 'v' then 'view'
        when 'm' then 'materialized_view'
        when 'f' then 'foreign_table'
        when 'p' then 'partitioned_table'
      end as "type",
      obj_description(c.oid) AS "comment"
    from
      pg_namespace nc
      join pg_class c on nc.oid = c.relnamespace
    where
      c.relkind in ('r', 'v', 'm', 'f', 'p')
      and not pg_is_other_temp_schema(nc.oid)
      and (
        pg_has_role(c.relowner, 'USAGE')
        or has_table_privilege(
          c.oid,
          'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
        )
        or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
      )
      and c.oid = '${id}'::int8;
  `

  return sql
}

export type Table = {
  id: number
  name: string
  schema: string
  type: 'table' | 'view' | 'materialized_view' | 'foreign_table' | 'partitioned_table'
  comment: string | null
}

export type TableResponse = {
  result: Table
}

export type TableVariables = {
  projectRef?: string
  connectionString?: string
  id?: string
}

export type TableData = TableResponse
export type TableError = unknown

export const useTableQuery = <TData extends TableData = TableData>(
  { projectRef, connectionString, id }: TableVariables,
  { enabled = true, ...options }: UseQueryOptions<ExecuteSqlData, TableError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: id ? getTableSql({ id }) : '',
      queryKey: ['tables', id],
    },
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )

export const useTablePrefetch = ({ projectRef, connectionString, id }: TableVariables) => {
  return useExecuteSqlPrefetch({
    projectRef,
    connectionString,
    sql: getTableSql({ id }),
    queryKey: ['tables', id],
  })
}
