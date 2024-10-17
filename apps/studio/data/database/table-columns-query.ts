import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

export type TableColumn = {
  schemaname: string
  tablename: string
  quoted_name: string
  is_table: boolean
  columns: any[]
}

export const getTableColumnsQuery = (table?: string, schema?: string) => {
  const conditions = []
  if (table) {
    conditions.push(`tablename = '${table}'`)
  }
  if (schema) {
    conditions.push(`schemaname = '${schema}'`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sql = /* SQL */ `
  
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
  ${whereClause}
  GROUP BY schemaname, tablename, quoted_name, is_table;
`.trim()

  return sql
}

export type TableColumnsVariables = {
  projectRef?: string
  connectionString?: string
  table?: string
  schema?: string
}

export type TableColumnsData = { result: TableColumn[] }
export type TableColumnsError = ExecuteSqlError

export const useTableColumnsQuery = <TData extends TableColumnsData = TableColumnsData>(
  { projectRef, connectionString, table, schema }: TableColumnsVariables,
  options: UseQueryOptions<ExecuteSqlData, TableColumnsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getTableColumnsQuery(table, schema),
      queryKey: ['table-columns', schema, table],
    },
    options
  )
}
