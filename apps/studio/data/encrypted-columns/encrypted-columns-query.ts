import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import { getViews } from 'data/views/views-query'
import type { ResponseError } from 'types'
import { encryptedColumnKeys } from './keys'

export type EncryptedColumnsVariables = {
  projectRef?: string
  connectionString?: string
  schema?: string
  tableName?: string
}

export async function getEncryptedColumns(
  { projectRef, connectionString, schema, tableName }: EncryptedColumnsVariables,
  signal?: AbortSignal
) {
  if (!tableName) return []

  const views = await getViews({ projectRef, connectionString, schema }, signal)
  const decryptedView = views.find((view) => view.name === `decrypted_${tableName}`)
  if (!decryptedView) return []

  try {
    const encryptedColumns = await executeSql(
      {
        projectRef,
        connectionString,
        sql: `SELECT column_name as name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'decrypted_${tableName}' and column_name like 'decrypted_%'`,
      },
      signal
    )
    return encryptedColumns.result.map((column: any) => column.name.split('decrypted_')[1])
  } catch (error) {
    console.error('Error fetching encrypted columns', error)
    return []
  }
}

export type EncryptedColumnsData = Awaited<ReturnType<typeof getEncryptedColumns>>
export type EncryptedColumnsError = ResponseError

export const useEncryptedColumnsQuery = <TData = EncryptedColumnsData>(
  { projectRef, connectionString, schema, tableName }: EncryptedColumnsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EncryptedColumnsData, EncryptedColumnsError, TData> = {}
) =>
  useQuery<EncryptedColumnsData, EncryptedColumnsError, TData>(
    encryptedColumnKeys.list(projectRef, schema, tableName),
    ({ signal }) =>
      getEncryptedColumns({ projectRef, connectionString, schema, tableName }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export function prefetchEncryptedColumns(
  client: QueryClient,
  { projectRef, connectionString, schema, tableName }: EncryptedColumnsVariables
) {
  const key = encryptedColumnKeys.list(projectRef, schema, tableName)

  return client
    .prefetchQuery(key, ({ signal }) =>
      getEncryptedColumns(
        {
          projectRef,
          connectionString,
          schema,
          tableName,
        },
        signal
      )
    )
    .then(() => client.getQueryData<EncryptedColumnsData>(key, { exact: true }))
}
