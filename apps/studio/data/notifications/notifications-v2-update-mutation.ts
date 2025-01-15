import { createMutation } from 'react-query-kit'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import { getQueryClient } from 'data/query-client'
import type { ResponseError } from 'types'
import { useNotificationsV2Query } from './notifications-v2-query'

export type NotificationsUpdateVariables = {
  ids: string[]
  status: 'new' | 'seen' | 'archived'
}

export async function updateNotifications({ ids, status }: NotificationsUpdateVariables) {
  const { data, error } = await patch('/platform/notifications', {
    body: ids.map((id) => {
      return { id, status }
    }),
    headers: { Version: '2' },
  })
  if (error) handleError(error)
  return data
}

type NotificationsUpdateData = Awaited<ReturnType<typeof updateNotifications>>

export const useNotificationsV2UpdateMutation = createMutation<
  NotificationsUpdateData,
  NotificationsUpdateVariables,
  ResponseError
>({
  mutationFn: updateNotifications,
  async onSuccess(data, variables, context) {
    const queryClient = getQueryClient()

    await queryClient.invalidateQueries({ queryKey: useNotificationsV2Query.getKey() })
  },
  onError(data) {
    toast.error(`Failed to update notifications: ${data.message}`)
  },
})
