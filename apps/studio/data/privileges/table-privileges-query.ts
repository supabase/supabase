import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { privilegeKeys } from './keys'

export type TablePrivilegesVariables = {
  projectRef?: string
  connectionString?: string
}

export type TablePrivilege = components['schemas']['PostgresTablePrivileges']

export async function getTablePrivileges(
  { projectRef, connectionString }: TablePrivilegesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/table-privileges', {
    params: {
      path: { ref: projectRef },
      // this is needed to satisfy the typescript, but it doesn't pass the actual header
      header: { 'x-connection-encrypted': connectionString! },
    },
    signal,
    headers,
  })

  if (error) throw handleError(error)
  return data
}

export type TablePrivilegesData = Awaited<ReturnType<typeof getTablePrivileges>>
export type TablePrivilegesError = ResponseError

export const useTablePrivilegesQuery = <TData = TablePrivilegesData>(
  { projectRef, connectionString }: TablePrivilegesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TablePrivilegesData, TablePrivilegesError, TData> = {}
) =>
  useQuery<TablePrivilegesData, TablePrivilegesError, TData>(
    privilegeKeys.tablePrivilegesList(projectRef),
    ({ signal }) => getTablePrivileges({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
