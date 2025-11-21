import { useQuery } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { configKeys } from './keys'

export type DiskBreakdownVariables = {
  projectRef?: string
  connectionString?: string | null
}

type DiskBreakdownResult = {
  db_size_bytes: number
  wal_size_bytes: number
}

export async function getDiskBreakdown(
  { projectRef, connectionString }: DiskBreakdownVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!connectionString) throw new Error('Connection string is required')

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: `
    SELECT
  (
    SELECT
      SUM(pg_database_size(pg_database.datname)) AS db_size_bytes
    FROM
      pg_database
  ),
  (
    SELECT SUM(size)
    FROM
      pg_ls_waldir()
  ) AS wal_size_bytes`,
    },
    signal
  )

  return result[0] as DiskBreakdownResult
}

export type DiskBreakdownData = Awaited<ReturnType<typeof getDiskBreakdown>>
export type DiskBreakdownError = ResponseError

export const useDiskBreakdownQuery = <TData = DiskBreakdownData>(
  { projectRef, connectionString }: DiskBreakdownVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DiskBreakdownData, DiskBreakdownError, TData> = {}
) =>
  useQuery<DiskBreakdownData, DiskBreakdownError, TData>({
    queryKey: configKeys.diskBreakdown(projectRef),
    queryFn: ({ signal }) => getDiskBreakdown({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
