import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import minify from 'pg-minify'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { SUPPORTED_PGMQ_VERSIONS, SupportedPgmqVersion } from './constants'

export type DatabaseQueuesVersionVariables = {
  projectRef?: string
  connectionString?: string | null
}

const pgmqVersionQuery = minify(/* SQL */ `
    SELECT extversion
    FROM pg_extension 
    WHERE extname = 'pgmq';
`)

export async function getDatabaseQueuesVersion({
  projectRef,
  connectionString,
}: DatabaseQueuesVersionVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: pgmqVersionQuery,
  })

  const version = result[0]?.extversion
  if (!version) return null

  if (!SUPPORTED_PGMQ_VERSIONS.includes(version)) return null

  return version as SupportedPgmqVersion
}

export type DatabaseQueueVersionData = SupportedPgmqVersion | null
export type DatabaseQueueVersionError = ResponseError

export const useDatabaseQueuesVersionQuery = <TData = DatabaseQueueVersionData>(
  { projectRef, connectionString }: DatabaseQueuesVersionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseQueueVersionData, DatabaseQueueVersionError, TData> = {}
) =>
  useQuery<DatabaseQueueVersionData, DatabaseQueueVersionError, TData>({
    queryKey: databaseQueuesKeys.version(projectRef),
    queryFn: () => getDatabaseQueuesVersion({ projectRef, connectionString }),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
