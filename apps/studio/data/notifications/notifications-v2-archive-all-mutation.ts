import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { notificationKeys } from './keys'

export async function archiveAllNotifications() {
  const { data, error } = await patch('/platform/notifications/archive-all', {
    headers: { Version: '2' },
  })

  if (error) handleError(error)
  return data
}

type NotificationsArchiveAllData = Awaited<ReturnType<typeof archiveAllNotifications>>

export const useNotificationsArchiveAllMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<NotificationsArchiveAllData, ResponseError>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<NotificationsArchiveAllData, ResponseError>(() => archiveAllNotifications(), {
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries(notificationKeys.list())
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to archive all notifications: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
