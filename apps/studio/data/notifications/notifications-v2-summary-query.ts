import type { Notification } from '@supabase/shared-types/out/notifications'
import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { notificationKeys } from './keys'

export type NotificationsResponse = Notification[]

export async function getNotificationsSummary(signal?: AbortSignal) {
  const { data, error } = await get('/platform/notifications/summary', {
    signal,
  })
  if (error) handleError(error)
  return data
}

export type NotificationsData = Awaited<ReturnType<typeof getNotificationsSummary>>
export type NotificationsError = ResponseError

export const useNotificationsSummaryQuery = <TData = NotificationsData>(
  options: UseCustomQueryOptions<NotificationsData, NotificationsError, TData> = {}
) =>
  useQuery<NotificationsData, NotificationsError, TData>({
    queryKey: notificationKeys.summary(),
    queryFn: ({ signal }) => getNotificationsSummary(signal),
    ...options,
  })
