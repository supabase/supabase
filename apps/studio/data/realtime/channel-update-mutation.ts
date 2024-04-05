import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import type { ResponseError } from 'types'
import { realtimeKeys } from './keys'

export type ChannelUpdateVariables = {
  projectRef: string
  endpoint: string
  accessToken: string
  name: string
  newName: string
}

const updateChannel = async ({ endpoint, accessToken, name, newName }: ChannelUpdateVariables) => {
  const response = await patch(
    `${endpoint}/realtime/v1/api/channels/${name}`,
    { name },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  if (response.error) {
    throw response.error
  }
  return newName
}

type ChannelUpdateData = Awaited<ReturnType<typeof updateChannel>>

export const useChannelUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ChannelUpdateData, ResponseError, ChannelUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ChannelUpdateData, ResponseError, ChannelUpdateVariables>(
    (vars) => updateChannel(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(realtimeKeys.channels(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update channel: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
