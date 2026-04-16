import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'

import { miscKeys } from './keys'
import { fetchHandler } from '@/data/fetchers'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ChangelogRecentItem = { title: string; url: string }

export type ChangelogRecentData = { items: ChangelogRecentItem[] }

/**
 * Next's `router.basePath` must be used for same-origin `/api/*` fetches when `next.config` sets `basePath`.
 * `NEXT_PUBLIC_BASE_PATH` can be missing or out of sync in some local setups.
 */
export async function getChangelogRecent(pathPrefix: string): Promise<ChangelogRecentData> {
  const prefix = pathPrefix || BASE_PATH
  const url = `${prefix}/api/changelog-recent`
  const res = await fetchHandler(url)
  if (!res.ok) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[changelog-recent] fetch failed', res.status, url)
    }
    return { items: [] }
  }
  const json = (await res.json()) as ChangelogRecentData & { _devError?: string }
  if (process.env.NODE_ENV === 'development' && json._devError) {
    console.warn('[changelog-recent]', json._devError)
  }
  return { items: json.items ?? [] }
}

export type ChangelogRecentError = ResponseError

export const useChangelogRecentQuery = <TData = ChangelogRecentData>({
  enabled = false,
  ...options
}: UseCustomQueryOptions<ChangelogRecentData, ChangelogRecentError, TData> = {}) => {
  const router = useRouter()
  const pathPrefix = router.basePath ?? ''

  return useQuery<ChangelogRecentData, ChangelogRecentError, TData>({
    queryKey: miscKeys.changelogRecent(pathPrefix),
    queryFn: () => getChangelogRecent(pathPrefix),
    // Keep short so a bad first fetch (e.g. PEM formatting) does not stick for the whole session.
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
    enabled: IS_PLATFORM && enabled,
  })
}
