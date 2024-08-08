import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { notificationKeys } from './keys'

export type NotificationsDismissVariables = {
  ids: string[]
}

export async function dismissNotifications({ ids }: NotificationsDismissVariables) {
  const { data, error } = await del('/platform/notifications', { body: { ids } })

  if (error) handleError(error)
  return data
}

type NotificationsDismissData = Awaited<ReturnType<typeof dismissNotifications>>

export const useNotificationsDismissMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<NotificationsDismissData, ResponseError, NotificationsDismissVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<NotificationsDismissData, ResponseError, NotificationsDismissVariables>(
    (vars) => dismissNotifications(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(notificationKeys.list())
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to dismiss notifications: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
