import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'
import { notificationKeys } from './keys'

export type NotificationsUpdateVariables = {
  id: string
  status: 'new' | 'seen' | 'archived'
}

export async function updateNotifications({ id, status }: NotificationsUpdateVariables) {
  const { data, error } = await patch('/platform/notifications', {
    // @ts-ignore
    body: [{ id, status }],
    headers: { Version: '2' },
  })
  if (error) throw error
  return data
}

type NotificationsUpdateData = Awaited<ReturnType<typeof updateNotifications>>

export const useNotificationsV2UpdateMutation = ({
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
        await queryClient.invalidateQueries(['notifications'])
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
