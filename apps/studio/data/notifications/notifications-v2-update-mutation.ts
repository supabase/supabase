import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'

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
