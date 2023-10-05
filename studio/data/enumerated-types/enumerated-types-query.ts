import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { components } from 'data/api'

export type EnumeratedTypesVariables = {
  projectRef?: string
  connectionString?: string
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
    // @ts-ignore: We don't need to pass included included_schemas / excluded_schemas in query params
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
    },
    headers: Object.fromEntries(headers),
    signal,
  })

  if (error) throw error
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
