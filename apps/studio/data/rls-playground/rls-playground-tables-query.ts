import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { rlsPlaygroundKeys } from './keys'

export interface RLSPlaygroundTable {
  id: number
  schema: string
  name: string
  rls_enabled: boolean
  rls_forced: boolean
  policy_count: number
}

type RLSPlaygroundTablesVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
}

export async function getRLSPlaygroundTables(
  { projectRef, connectionString, schema = 'public' }: RLSPlaygroundTablesVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers(headersInit)
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/rls-playground/tables' as any, {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { schema },
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data as RLSPlaygroundTable[]
}

export type RLSPlaygroundTablesData = Awaited<ReturnType<typeof getRLSPlaygroundTables>>
export type RLSPlaygroundTablesError = ResponseError

export const useRLSPlaygroundTablesQuery = <TData = RLSPlaygroundTablesData>(
  { projectRef, connectionString, schema = 'public' }: RLSPlaygroundTablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<RLSPlaygroundTablesData, RLSPlaygroundTablesError, TData> = {}
) => {
  return useQuery<RLSPlaygroundTablesData, RLSPlaygroundTablesError, TData>({
    queryKey: rlsPlaygroundKeys.tables(projectRef, schema),
    queryFn: ({ signal }) =>
      getRLSPlaygroundTables({ projectRef, connectionString, schema }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}
