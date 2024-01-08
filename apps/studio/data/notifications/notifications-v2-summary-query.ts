import { Notification } from '@supabase/shared-types/out/notifications'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { notificationKeys } from './keys'

export type NotificationsResponse = Notification[]

export async function getNotificationsSummary(signal?: AbortSignal) {
  const { data, error } = await get('/platform/notifications/summary', {
    signal,
  })
  if (error) throw error
  return data
}

export type NotificationsData = Awaited<ReturnType<typeof getNotificationsSummary>>
export type NotificationsError = ResponseError

export const useNotificationsSummaryQuery = <TData = NotificationsData>(
  options: UseQueryOptions<NotificationsData, NotificationsError, TData> = {}
) =>
  useQuery<NotificationsData, NotificationsError, TData>(
    notificationKeys.summary(),
    ({ signal }) => getNotificationsSummary(signal),
    options
  )
