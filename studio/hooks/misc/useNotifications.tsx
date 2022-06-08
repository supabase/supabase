import useSWR from 'swr'
import { Notification } from '@supabase/shared-types/out/notifications'

import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export const useNotifications = () => {
  const { data, error, mutate } = useSWR<Notification[]>(`${API_URL}/notifications`, get)

  const anyError = (data as any)?.error || error !== undefined
  const refresh = () => mutate()

  return {
    notifications: anyError ? undefined : data,
    isLoading: !anyError && !data,
    isError: !!anyError,
    refresh,
  }
}
