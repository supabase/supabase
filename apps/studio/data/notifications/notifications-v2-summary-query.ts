import { createQuery } from 'react-query-kit'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export async function getNotificationsSummary(_: void, { signal }: { signal: AbortSignal }) {
  const { data, error } = await get('/platform/notifications/summary', {
    signal,
  })
  if (error) handleError(error)
  return data
}

export type NotificationsData = Awaited<ReturnType<typeof getNotificationsSummary>>
export type NotificationsError = ResponseError

export const useNotificationsSummaryQuery = createQuery<
  NotificationsData,
  void,
  NotificationsError
>({
  queryKey: ['notifications', 'summary'],
  fetcher: getNotificationsSummary,
  staleTime: 1000 * 60 * 5, // 5 mins
})
