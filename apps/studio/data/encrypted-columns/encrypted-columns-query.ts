import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
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

  try {
    const encryptedColumns = await executeSql(
      {
        projectRef,
        connectionString,
        sql: `select column_name as name from information_schema.columns where table_schema = '${schema}' and table_name = 'decrypted_${tableName}' and column_name like 'decrypted_%'`,
        queryKey: ['encrypted-columns', tableName],
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
  return client.fetchQuery(encryptedColumnKeys.list(projectRef, schema, tableName), ({ signal }) =>
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
}
