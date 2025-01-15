import { createQuery } from 'react-query-kit'

import { IS_PLATFORM } from 'common'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export async function getResourceWarnings(_: void, { signal }: { signal: AbortSignal }) {
  const { data, error } = await get(`/platform/projects-resource-warnings`, { signal })
  if (error) handleError(error)

  return data
}

export type ResourceWarning = components['schemas']['ProjectResourceWarningsResponse']
export type ResourceWarningsData = Awaited<ReturnType<typeof getResourceWarnings>>
export type ResourceWarningsError = ResponseError

export const useResourceWarningsQuery = createQuery<
  ResourceWarningsData,
  void,
  ResourceWarningsError
>({
  queryKey: ['projects', 'resource-warnings'],
  fetcher: getResourceWarnings,
  enabled: IS_PLATFORM,
  staleTime: 1000 * 60 * 30, // default 30 minutes
})
