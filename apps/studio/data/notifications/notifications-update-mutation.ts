import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { notificationKeys } from './keys'

export type NotificationsUpdateVariables = {
  ids: string[]
}

export async function updateNotifications({ ids }: NotificationsUpdateVariables) {
  // @ts-ignore
  const { data, error } = await patch('/platform/notifications', { body: { ids } })

  if (error) handleError(error)
  return data
}

type NotificationsUpdateData = Awaited<ReturnType<typeof updateNotifications>>

export const useNotificationsUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<NotificationsUpdateData, ResponseError, NotificationsUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<NotificationsUpdateData, ResponseError, NotificationsUpdateVariables>(
    (vars) => updateNotifications(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(notificationKeys.list())
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update notifications: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
