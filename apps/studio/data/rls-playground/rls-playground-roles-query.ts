import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { rlsPlaygroundKeys } from './keys'

type RLSPlaygroundRolesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getRLSPlaygroundRoles(
  { projectRef, connectionString }: RLSPlaygroundRolesVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers(headersInit)
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/rls-playground/roles' as any, {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data as string[]
}

export type RLSPlaygroundRolesData = Awaited<ReturnType<typeof getRLSPlaygroundRoles>>
export type RLSPlaygroundRolesError = ResponseError

export const useRLSPlaygroundRolesQuery = <TData = RLSPlaygroundRolesData>(
  { projectRef, connectionString }: RLSPlaygroundRolesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<RLSPlaygroundRolesData, RLSPlaygroundRolesError, TData> = {}
) => {
  return useQuery<RLSPlaygroundRolesData, RLSPlaygroundRolesError, TData>({
    queryKey: rlsPlaygroundKeys.roles(projectRef, connectionString),
    queryFn: ({ signal }) => getRLSPlaygroundRoles({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}
