import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databasePoliciesKeys } from './keys'

export type DatabasePoliciesVariables = {
  projectRef?: string
  connectionString?: string
  schema?: string
}

export async function getDatabasePolicies(
  { projectRef, connectionString, schema }: DatabasePoliciesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/policies', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: {
        included_schemas: schema || '',
        excluded_schemas: '',
      },
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DatabasePoliciesData = Awaited<ReturnType<typeof getDatabasePolicies>>
export type DatabasePoliciesError = ResponseError

export const useDatabasePoliciesQuery = <TData = DatabasePoliciesData>(
  { projectRef, connectionString, schema }: DatabasePoliciesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabasePoliciesData, DatabasePoliciesError, TData> = {}
) =>
  useQuery<DatabasePoliciesData, DatabasePoliciesError, TData>(
    databasePoliciesKeys.list(projectRef, schema),
    ({ signal }) => getDatabasePolicies({ projectRef, connectionString, schema }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
