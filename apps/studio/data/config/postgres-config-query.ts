import { queryOptions } from '@tanstack/react-query'

import { configKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type PostgresConfigurationVariables = {
  projectRef?: string
}

export async function getPostgresConfiguration(
  { projectRef }: PostgresConfigurationVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get('/v1/projects/{ref}/config/database/postgres', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type PostgresConfigurationData = Awaited<ReturnType<typeof getPostgresConfiguration>>
export type PostgresConfigurationError = ResponseError

export const postgresConfigurationQueryOptions = (
  { projectRef }: PostgresConfigurationVariables,
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return queryOptions({
    queryKey: configKeys.postgresConfig(projectRef),
    queryFn: ({ signal }) => getPostgresConfiguration({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}
