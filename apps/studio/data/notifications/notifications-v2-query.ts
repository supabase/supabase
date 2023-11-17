import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { NotificationName } from '@supabase/shared-types/out/notifications'

import { ResponseError } from 'types'
import { notificationKeys } from './keys'
import { components } from 'data/api'

export type NotificationVariables = {
  archived: boolean
  offset: number
  limit: number
}

export type Notification = components['schemas']['NotificationResponseV2']

/**
 * Notification Data - This is not typed from the API end as it's meant to open-ended
 * @param title: Title of the notification
 * @param message: Rendered as Markdown to support inline links. Should be capped to n characters
 * @param project_id: (Optional) Only available if notification is specifically for a project (e.g exhaustion notification)
 * @param actions: (Optional) Any sort of actions that we want to provide users, could be external link, could be something that needs to be handled on FE
 */
export type NotificationData = {
  title: string
  message: string
  project_id?: number
  actions: { label: string; url?: string; action_type?: string }[]
}

export async function getNotifications(options: NotificationVariables, signal?: AbortSignal) {
  const { data, error } = await get('/platform/notifications', {
    params: { query: options },
    headers: { Version: '2' },
    signal,
  })

  if (error) throw error

  return data
}

export type NotificationsData = Awaited<ReturnType<typeof getNotifications>>
export type NotificationsError = ResponseError

export const useNotificationsV2Query = <TData = NotificationsData>(
  vars: NotificationVariables,
  options: UseQueryOptions<NotificationsData, NotificationsError, TData> = {}
) => {
  return useQuery<NotificationsData, NotificationsError, TData>(
    notificationKeys.listV2(vars),
    ({ signal }) => getNotifications(vars, signal),
    options
  )
}
