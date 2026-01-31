import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { PostgresPolicy } from '@supabase/postgres-meta'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { rlsPlaygroundKeys } from './keys'

type RLSPlaygroundPoliciesVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
  table?: string
}

export async function getRLSPlaygroundPolicies(
  { projectRef, connectionString, schema = 'public', table }: RLSPlaygroundPoliciesVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!table) throw new Error('table is required')

  let headers = new Headers(headersInit)
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get(
    '/platform/pg-meta/{ref}/rls-playground/policies/{schema}/{table}' as any,
    {
      params: {
        header: { 'x-connection-encrypted': connectionString! },
        path: { ref: projectRef, schema, table },
      },
      headers,
      signal,
    }
  )

  if (error) handleError(error)
  return data as PostgresPolicy[]
}

export type RLSPlaygroundPoliciesData = Awaited<ReturnType<typeof getRLSPlaygroundPolicies>>
export type RLSPlaygroundPoliciesError = ResponseError

export const useRLSPlaygroundPoliciesQuery = <TData = RLSPlaygroundPoliciesData>(
  { projectRef, connectionString, schema = 'public', table }: RLSPlaygroundPoliciesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<RLSPlaygroundPoliciesData, RLSPlaygroundPoliciesError, TData> = {}
) => {
  return useQuery<RLSPlaygroundPoliciesData, RLSPlaygroundPoliciesError, TData>({
    queryKey: rlsPlaygroundKeys.policies(projectRef, schema, table ?? ''),
    queryFn: ({ signal }) =>
      getRLSPlaygroundPolicies({ projectRef, connectionString, schema, table }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && !!table,
    ...options,
  })
}
