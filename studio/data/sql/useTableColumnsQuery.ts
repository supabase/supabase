import { UseQueryOptions } from '@tanstack/react-query'
import {
  ExecuteQueryData,
  useExecuteQueryPrefetch,
  useExecuteQueryQuery,
} from './useExecuteQueryQuery'

export const TABLE_COLUMNS_QUERY = /* SQL */ `
SELECT
  tbl.schemaname,
  tbl.tablename,
  tbl.quoted_name,
  tbl.is_table,
  json_agg(a) as columns
FROM
  (
    SELECT
      n.nspname as schemaname,
      c.relname as tablename,
      (quote_ident(n.nspname) || '.' || quote_ident(c.relname)) as quoted_name,
      true as is_table
    FROM
      pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE
      c.relkind = 'r'
      AND n.nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
      AND n.nspname not like 'pg_temp_%'
      AND n.nspname not like 'pg_toast_temp_%'
      AND has_schema_privilege(n.oid, 'USAGE') = true
      AND has_table_privilege(quote_ident(n.nspname) || '.' || quote_ident(c.relname), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
    union all
    SELECT
      n.nspname as schemaname,
      c.relname as tablename,
      (quote_ident(n.nspname) || '.' || quote_ident(c.relname)) as quoted_name,
      false as is_table
    FROM
      pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE
      c.relkind in ('v', 'm')
      AND n.nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
      AND n.nspname not like 'pg_temp_%'
      AND n.nspname not like 'pg_toast_temp_%'
      AND has_schema_privilege(n.oid, 'USAGE') = true
      AND has_table_privilege(quote_ident(n.nspname) || '.' || quote_ident(c.relname), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
  ) as tbl
  LEFT JOIN (
    SELECT
      attrelid,
      attname,
      format_type(atttypid, atttypmod) as data_type,
      attnum,
      attisdropped
    FROM
      pg_attribute
  ) as a ON (
    a.attrelid = tbl.quoted_name::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND has_column_privilege(tbl.quoted_name, a.attname, 'SELECT, INSERT, UPDATE, REFERENCES')
  )
GROUP BY schemaname, tablename, quoted_name, is_table;
`

export type TableColumnsVariables = {
  projectRef?: string
  connectionString?: string
}

export type TableColumnsData = ExecuteQueryData
export type TableColumnsError = unknown

export const useTableColumnsQuery = <TData = TableColumnsData>(
  { projectRef, connectionString }: TableColumnsVariables,
  options: UseQueryOptions<TableColumnsData, TableColumnsError, TData> = {}
) => useExecuteQueryQuery({ projectRef, connectionString, sql: TABLE_COLUMNS_QUERY }, options)

export const useTableColumnsPrefetch = ({
  projectRef,
  connectionString,
}: TableColumnsVariables) => {
  return useExecuteQueryPrefetch({ projectRef, connectionString, sql: TABLE_COLUMNS_QUERY })
}
