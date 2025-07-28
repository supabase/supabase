import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'

export type EnumeratedTypesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type EnumeratedType = components['schemas']['PostgresType']

export async function getEnumeratedTypes(
  { projectRef, connectionString }: EnumeratedTypesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/types', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
        'x-pg-application-name': DEFAULT_PLATFORM_APPLICATION_NAME,
      },
      path: { ref: projectRef },
    },
    headers: Object.fromEntries(headers),
    signal,
  })

  if (error) handleError(error)
  return data
}

export type EnumeratedTypesData = Awaited<ReturnType<typeof getEnumeratedTypes>>
export type EnumeratedTypesError = ResponseError

export const useEnumeratedTypesQuery = <TData = EnumeratedTypesData>(
  { projectRef, connectionString }: EnumeratedTypesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EnumeratedTypesData, EnumeratedTypesError, TData> = {}
) =>
  useQuery<EnumeratedTypesData, EnumeratedTypesError, TData>(
    enumeratedTypesKeys.list(projectRef),
    ({ signal }) => getEnumeratedTypes({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
