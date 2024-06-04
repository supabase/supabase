import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

// [Joshen] Future refactor to move to pg-meta once available

export type DatabaseIndex = {
  name: string
  schema: string
  table: string
  definition: string
  enabled: boolean
}

export const getIndexesQuery = ({ schema }: { schema: string }) => {
  const sql = /* SQL */ `
SELECT schemaname as "schema",
  tablename as "table",
  indexname as "name",
  indexdef as "definition"
FROM pg_indexes
WHERE schemaname = '${schema}';
`.trim()

  return sql
}

type getIndexesDefinition = {
  schema: string
}

export type IndexesVariables = getIndexesDefinition & {
  projectRef?: string
  connectionString?: string
}

export type IndexesData = { result: DatabaseIndex[] }
export type IndexesError = ExecuteSqlError

export const useIndexesQuery = <TData extends IndexesData = IndexesData>(
  { schema, projectRef, connectionString }: IndexesVariables,
  options: UseQueryOptions<ExecuteSqlData, IndexesError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getIndexesQuery({ schema }),
      queryKey: ['indexes', schema],
    },
    options
  )
}
