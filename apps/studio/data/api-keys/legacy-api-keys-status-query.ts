import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { apiKeysKeys } from './keys'

interface LegacyAPIKeysStatusVariables {
  projectRef?: string
}

async function getLegacyAPIKeysStatus(
  { projectRef }: LegacyAPIKeysStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/api-keys/legacy`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

type LegacyAPIKeysStatusData = Awaited<ReturnType<typeof getLegacyAPIKeysStatus>>

export const useLegacyAPIKeysStatusQuery = <TData = LegacyAPIKeysStatusData>(
  { projectRef }: LegacyAPIKeysStatusVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<LegacyAPIKeysStatusData, ResponseError, TData> = {}
) =>
  useQuery<LegacyAPIKeysStatusData, ResponseError, TData>({
    queryKey: apiKeysKeys.status(projectRef),
    queryFn: ({ signal }) => getLegacyAPIKeysStatus({ projectRef }, signal),
    enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined',
    ...options,
  })
