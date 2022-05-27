import { NotificationName, NotificationStatus } from '@supabase/shared-types/out/notifications'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import useSWR from 'swr'

export interface Notification {
  id: string
  project_id: number
  inserted_at: number
  notification_name: NotificationName
  notification_status: NotificationStatus
  // Contains information on the particular notification
  data: object
  // Contains e.g possible actions user should act on based on the notification
  meta: object
}

export const useNotifications = () => {
  const { data, error, mutate } = useSWR<Notification[]>(`${API_URL}/notifications`, get)
  const anyError = error !== undefined
  const refresh = () => mutate()

  return {
    notifications: anyError ? undefined : data,
    isLoading: !anyError && !data,
    isError: !!anyError,
    refresh,
  }
}
