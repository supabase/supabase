import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { PostgresRole } from '@supabase/postgres-meta'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseRolesKeys } from './keys'

export type DatabaseRolesVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getDatabaseRoles(
  { projectRef, connectionString }: DatabaseRolesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/roles', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
    },
    headers,
    signal,
  })

  if (error) throw error
  return data as PostgresRole[]
}

export type DatabaseRolesData = Awaited<ReturnType<typeof getDatabaseRoles>>
export type DatabaseRolesError = ResponseError

export const useDatabaseRolesQuery = <TData = DatabaseRolesData>(
  { projectRef, connectionString }: DatabaseRolesVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseRolesData, DatabaseRolesError, TData> = {}
) =>
  useQuery<DatabaseRolesData, DatabaseRolesError, TData>(
    databaseRolesKeys.list(projectRef),
    ({ signal }) => getDatabaseRoles({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
