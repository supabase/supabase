import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, isResponseOk } from 'lib/common/fetch'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { resourceKeys } from './keys'

// check to see if the OPENAI_API_KEY env var is set in self-hosted
// so we can disable the chat editor and add a warning about manually adding the key

export async function checkOpenAIKey(signal?: AbortSignal) {
  const response = await get(`${BASE_PATH}/api/ai/sql/check-api-key`, { signal })

  if (!isResponseOk(response)) {
    throw (response as any).error
  }

  return response as { hasKey: boolean }
}

export type ResourceData = Awaited<ReturnType<typeof checkOpenAIKey>>
export type ResourceError = { errorEventId: string; message: string }

export const useCheckOpenAIKeyQuery = <TData = ResourceData>({
  enabled = true,
  ...options
}: UseQueryOptions<ResourceData, ResourceError, TData> = {}) =>
  useQuery<ResourceData, ResourceError, TData>(
    resourceKeys.apiKey(),
    ({ signal }) => checkOpenAIKey(signal),
    { enabled: !IS_PLATFORM && enabled, ...options }
  )
