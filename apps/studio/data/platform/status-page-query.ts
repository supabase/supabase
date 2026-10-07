import { queryOptions } from '@tanstack/react-query'

import { platformKeys } from './keys'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'
import {
  StatusPageResponseSchema,
  type StatusPageResponse,
} from '@/lib/status-page/status-page.schema'
import { ResponseError } from '@/types'

async function getStatusPage(signal?: AbortSignal): Promise<StatusPageResponse> {
  const response = await fetch(`${BASE_PATH}/api/status-page`, {
    signal,
    method: 'GET',
    credentials: 'omit',
  })

  if (!response.ok) {
    let retryAfter: number | undefined
    const retryAfterHeader = response.headers.get('Retry-After')
    if (retryAfterHeader !== null) {
      const parsed = Number(retryAfterHeader)
      if (Number.isFinite(parsed) && parsed > 0) retryAfter = parsed
    }

    throw new ResponseError(
      `Failed to fetch status page: ${response.statusText}`,
      response.status,
      undefined,
      retryAfter
    )
  }

  const json = await response.json()
  return StatusPageResponseSchema.parse(json)
}

export type StatusPageData = Awaited<ReturnType<typeof getStatusPage>>
export type StatusPageError = ResponseError

export const statusPageQueryOptions = () =>
  queryOptions({
    queryKey: platformKeys.statusPage(),
    queryFn: ({ signal }) => getStatusPage(signal),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    retryDelay: (attemptIndex: number, error: StatusPageError) => {
      if (error instanceof ResponseError && error.retryAfter) {
        return error.retryAfter * 1000
      }
      return Math.min(1000 * 4 ** attemptIndex, 1000 * 60 * 5)
    },
    enabled: IS_PLATFORM,
  })
