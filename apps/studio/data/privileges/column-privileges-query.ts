import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { privilegeKeys } from './keys'

export type ColumnPrivilegesVariables = {
  projectRef?: string
  connectionString?: string
}

export type ColumnPrivilege = components['schemas']['PostgresColumnPrivileges']

export async function getColumnPrivileges(
  { projectRef, connectionString }: ColumnPrivilegesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/column-privileges', {
    params: {
      path: { ref: projectRef },
      // this is needed to satisfy the typescript, but it doesn't pass the actual header
      header: { 'x-connection-encrypted': connectionString! },
    },
    signal,
    headers,
  })

  if (error) handleError(error)
  return data
}

export type ColumnPrivilegesData = Awaited<ReturnType<typeof getColumnPrivileges>>
export type ColumnPrivilegesError = ResponseError

export const useColumnPrivilegesQuery = <TData = ColumnPrivilegesData>(
  { projectRef, connectionString }: ColumnPrivilegesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ColumnPrivilegesData, ColumnPrivilegesError, TData> = {}
) =>
  useQuery<ColumnPrivilegesData, ColumnPrivilegesError, TData>(
    privilegeKeys.columnPrivilegesList(projectRef),
    ({ signal }) => getColumnPrivileges({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
