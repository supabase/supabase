import { useQuery } from '@tanstack/react-query'
import { UseCustomQueryOptions } from 'types'

import { ExecuteSqlError, executeSql } from '../sql/execute-sql-query'
import { getDatabaseExtensionDefaultSchemaSQL } from '../sql/queries/get-extension-default-schema'
import { databaseExtensionsKeys } from './keys'

type DatabaseExtentionDefaultSchemaVariables = {
  extension?: string
  projectRef?: string
  connectionString?: string | null
}

async function getDatabaseExtensionDefaultSchema(
  { extension, projectRef, connectionString }: DatabaseExtentionDefaultSchemaVariables,
  signal?: AbortSignal
) {
  if (!extension) {
    throw new Error('extension is required')
  }

  const sql = getDatabaseExtensionDefaultSchemaSQL({ extension })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['database-extension-default-schema', extension],
    },
    signal
  )

  return result[0] as { name: string; version: string; schema: string | null }
}

type DatabaseExtentionDefaultSchemaData = Awaited<
  ReturnType<typeof getDatabaseExtensionDefaultSchema>
>
type DatabaseExtentionDefaultSchemaError = ExecuteSqlError

export const useDatabaseExtentionDefaultSchemaQuery = <TData = DatabaseExtentionDefaultSchemaData>(
  { projectRef, connectionString, extension }: DatabaseExtentionDefaultSchemaVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    DatabaseExtentionDefaultSchemaData,
    DatabaseExtentionDefaultSchemaError,
    TData
  > = {}
) =>
  useQuery<DatabaseExtentionDefaultSchemaData, DatabaseExtentionDefaultSchemaError, TData>({
    queryKey: databaseExtensionsKeys.defaultSchema(projectRef, extension),
    queryFn: ({ signal }) =>
      getDatabaseExtensionDefaultSchema({ projectRef, connectionString, extension }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof extension !== 'undefined',
    ...options,
  })
