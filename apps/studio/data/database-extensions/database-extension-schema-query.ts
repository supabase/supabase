import { useQuery } from '@tanstack/react-query'
import { UseCustomQueryOptions } from 'types'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { getDatabaseExtensionDefaultSchemaSQL } from './database-extensions.sql'
import { databaseExtensionsKeys } from './keys'

type DatabaseExtensionDefaultSchemaVariables = {
  extension?: string
  projectRef?: string
  connectionString?: string | null
}

async function getDatabaseExtensionDefaultSchema(
  { extension, projectRef, connectionString }: DatabaseExtensionDefaultSchemaVariables,
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

type DatabaseExtensionDefaultSchemaData = Awaited<
  ReturnType<typeof getDatabaseExtensionDefaultSchema>
>
type DatabaseExtensionDefaultSchemaError = ExecuteSqlError

export const useDatabaseExtensionDefaultSchemaQuery = <TData = DatabaseExtensionDefaultSchemaData>(
  { projectRef, connectionString, extension }: DatabaseExtensionDefaultSchemaVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    DatabaseExtensionDefaultSchemaData,
    DatabaseExtensionDefaultSchemaError,
    TData
  > = {}
) =>
  useQuery<DatabaseExtensionDefaultSchemaData, DatabaseExtensionDefaultSchemaError, TData>({
    queryKey: databaseExtensionsKeys.defaultSchema(projectRef, extension),
    queryFn: ({ signal }) =>
      getDatabaseExtensionDefaultSchema({ projectRef, connectionString, extension }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof extension !== 'undefined',
    ...options,
  })
