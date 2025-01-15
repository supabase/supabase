import { createMutation } from 'react-query-kit'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import { getQueryClient } from 'data/query-client'
import type { ResponseError } from 'types'
import { useNotificationsV2Query } from './notifications-v2-query'

export async function archiveAllNotifications() {
  const { data, error } = await patch('/platform/notifications/archive-all', {
    headers: { Version: '2' },
  })

  if (error) handleError(error)
  return data
}

type NotificationsArchiveAllData = Awaited<ReturnType<typeof archiveAllNotifications>>

export const useNotificationsArchiveAllMutation = createMutation<
  NotificationsArchiveAllData,
  void,
  ResponseError
>({
  mutationFn: archiveAllNotifications,
  async onSuccess(data, variables, context) {
    const queryClient = getQueryClient()

    await queryClient.invalidateQueries({ queryKey: useNotificationsV2Query.getKey() })
  },
  onError(data) {
    toast.error(`Failed to archive all notifications: ${data.message}`)
  },
})
