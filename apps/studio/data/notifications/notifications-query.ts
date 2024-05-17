import type { Notification } from '@supabase/shared-types/out/notifications'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { notificationKeys } from './keys'

export type NotificationsResponse = Notification[]

export async function getNotifications(signal?: AbortSignal) {
  const response = await get(`${API_URL}/notifications`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as NotificationsResponse
}

export type NotificationsData = Awaited<ReturnType<typeof getNotifications>>
export type NotificationsError = unknown

export const useNotificationsQuery = <TData = NotificationsData>(
  options: UseQueryOptions<NotificationsData, NotificationsError, TData> = {}
) =>
  useQuery<NotificationsData, NotificationsError, TData>(
    notificationKeys.list(),
    ({ signal }) => getNotifications(signal),
    options
  )
