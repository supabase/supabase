import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

type GetIndexesArgs = {
  schema?: string
}

export const getIndexesSql = ({ schema }: GetIndexesArgs) => {
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

export type DatabaseIndex = {
  name: string
  schema: string
  table: string
  definition: string
  enabled: boolean
}

export type IndexesVariables = GetIndexesArgs & {
  projectRef?: string
  connectionString?: string
}

export async function getIndexes(
  { schema, projectRef, connectionString }: IndexesVariables,
  signal?: AbortSignal
) {
  if (!schema) {
    throw new Error('schema is required')
  }

  const sql = getIndexesSql({ schema })

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['indexes', schema] },
    signal
  )

  return result as DatabaseIndex[]
}

export type IndexesData = Awaited<ReturnType<typeof getIndexes>>
export type IndexesError = ExecuteSqlError

export const useIndexesQuery = <TData = IndexesData>(
  { projectRef, connectionString, schema }: IndexesVariables,
  { enabled = true, ...options }: UseQueryOptions<IndexesData, IndexesError, TData> = {}
) =>
  useQuery<IndexesData, IndexesError, TData>(
    databaseKeys.indexes(projectRef, schema),
    ({ signal }) => getIndexes({ projectRef, connectionString, schema }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof schema !== 'undefined',
      ...options,
    }
  )
