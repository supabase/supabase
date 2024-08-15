import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

type GetForeignKeyConstraintsVariables = {
  schema?: string
}

export type ForeignKeyConstraintRaw = {
  id: number
  constraint_name: string
  deletion_action: string
  update_action: string
  source_id: string
  source_schema: string
  source_table: string
  source_columns: string
  target_id: string
  target_schema: string
  target_table: string
  target_columns: string
}

export type ForeignKeyConstraint = {
  id: number
  constraint_name: string
  deletion_action: string
  update_action: string
  source_id: number
  source_schema: string
  source_table: string
  source_columns: string[]
  target_id: number
  target_schema: string
  target_table: string
  target_columns: string[]
}

export const getForeignKeyConstraintsQuery = ({ schema }: GetForeignKeyConstraintsVariables) => {
  const sql = /* SQL */ `
SELECT 
  con.oid as id, 
  con.conname as constraint_name, 
  con.confdeltype as deletion_action,
  con.confupdtype as update_action,
  rel.oid as source_id,
  nsp.nspname as source_schema, 
  rel.relname as source_table, 
  (
    SELECT 
      array_agg(
        att.attname 
        ORDER BY 
          un.ord
      ) 
    FROM 
      unnest(con.conkey) WITH ORDINALITY un (attnum, ord) 
      INNER JOIN pg_attribute att ON att.attnum = un.attnum 
    WHERE 
      att.attrelid = rel.oid
  ) source_columns, 
  frel.oid as target_id,
  fnsp.nspname as target_schema, 
  frel.relname as target_table, 
  (
    SELECT 
      array_agg(
        att.attname 
        ORDER BY 
          un.ord
      ) 
    FROM 
      unnest(con.confkey) WITH ORDINALITY un (attnum, ord) 
      INNER JOIN pg_attribute att ON att.attnum = un.attnum 
    WHERE 
      att.attrelid = frel.oid
  ) target_columns 
FROM 
  pg_constraint con 
  INNER JOIN pg_class rel ON rel.oid = con.conrelid 
  INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace 
  INNER JOIN pg_class frel ON frel.oid = con.confrelid 
  INNER JOIN pg_namespace fnsp ON fnsp.oid = frel.relnamespace 
WHERE 
  con.contype = 'f'
  ${schema !== undefined ? `AND nsp.nspname = '${schema}'` : ''};
`.trim()

  return sql
}

export type ForeignKeyConstraintsVariables = GetForeignKeyConstraintsVariables & {
  projectRef?: string
  connectionString?: string
}

export type ForeignKeyConstraintsData = ForeignKeyConstraint[]
export type ForeignKeyConstraintsError = ExecuteSqlError

export const useForeignKeyConstraintsQuery = <
  TData extends ForeignKeyConstraintsData = ForeignKeyConstraintsData,
>(
  { projectRef, connectionString, schema }: ForeignKeyConstraintsVariables,
  options: UseQueryOptions<ExecuteSqlData, ForeignKeyConstraintsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getForeignKeyConstraintsQuery({ schema }),
      queryKey: ['foreign-key-constraints'],
    },
    {
      select(data) {
        return ((data as any)?.result ?? []).map((foreignKey: ForeignKeyConstraintRaw) => {
          return {
            ...foreignKey,
            source_columns: foreignKey.source_columns.replace('{', '').replace('}', '').split(','),
            target_columns: foreignKey.target_columns.replace('{', '').replace('}', '').split(','),
          }
        })
      },
      ...options,
    }
  )
}
