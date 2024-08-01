import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

type GetTableConstraintsVariables = {
  schema?: string
  table?: string
}

export type Constraint = {
  id: number
  name: string
  type: string
}

export enum CONSTRAINT_TYPE {
  CHECK_CONSTRAINT = 'c',
  FOREIGN_KEY_CONSTRAINT = 'f',
  PRIMARY_KEY_CONSTRAINT = 'p',
  UNIQUE_CONSTRAINT = 'u',
  CONSTRAINT_TRIGGER = 't',
  EXCLUSION_CONSTRAINT = 'x',
}

export const getTableConstraints = ({ schema, table }: GetTableConstraintsVariables) => {
  const sql = /* SQL */ `
  SELECT 
    con.oid as id,
    con.conname as name,
    con.contype as type
  FROM pg_catalog.pg_constraint con
  INNER JOIN pg_catalog.pg_class rel
            ON rel.oid = con.conrelid
  INNER JOIN pg_catalog.pg_namespace nsp
            ON nsp.oid = connamespace
  WHERE nsp.nspname = '${schema}'
        AND rel.relname = '${table}';
`.trim()

  return sql
}

export type TableConstraintsVariables = GetTableConstraintsVariables & {
  projectRef?: string
  connectionString?: string
}

export type TableConstraintsData = Constraint[]
export type TableConstraintsError = ExecuteSqlError

export const useTableConstraintsQuery = <TData extends TableConstraintsData = TableConstraintsData>(
  { projectRef, connectionString, schema, table }: TableConstraintsVariables,
  options: UseQueryOptions<ExecuteSqlData, TableConstraintsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getTableConstraints({ schema, table }),
      queryKey: ['table-constraints'],
    },
    {
      enabled: typeof schema !== 'undefined' && typeof table !== 'undefined',
      select(data) {
        return (data as any)?.result ?? []
      },
      ...options,
    }
  )
}
