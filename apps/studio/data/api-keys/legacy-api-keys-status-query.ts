import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import { ResponseError } from 'types'
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

  if (error) {
    handleError(error)
  }

  return data
}

type LegacyAPIKeysStatusData = Awaited<ReturnType<typeof getLegacyAPIKeysStatus>>

export const useLegacyAPIKeysStatusQuery = <TData = LegacyAPIKeysStatusData>(
  { projectRef }: LegacyAPIKeysStatusVariables,
  { enabled, ...options }: UseQueryOptions<LegacyAPIKeysStatusData, ResponseError, TData> = {}
) =>
  useQuery<LegacyAPIKeysStatusData, ResponseError, TData>(
    apiKeysKeys.status(projectRef),
    ({ signal }) => getLegacyAPIKeysStatus({ projectRef }, signal),
    {
      enabled: IS_PLATFORM && enabled && !!projectRef,
      ...options,
    }
  )
