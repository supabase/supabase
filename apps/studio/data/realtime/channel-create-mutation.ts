import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import type { ResponseError } from 'types'
import { RealtimeChannel } from './channels-query'
import { realtimeKeys } from './keys'

export type ChannelCreateVariables = {
  projectRef: string
  endpoint: string
  accessToken: string
  name: string
}

const createChannel = async ({ endpoint, accessToken, name }: ChannelCreateVariables) => {
  const response = await post(
    `${endpoint}/realtime/v1/api/channels`,
    { name },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: accessToken,
      },
    }
  )
  if (response.error) {
    throw response.error
  }
  return response as RealtimeChannel
}

type ChannelCreateData = Awaited<ReturnType<typeof createChannel>>

export const useChannelCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ChannelCreateData, ResponseError, ChannelCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ChannelCreateData, ResponseError, ChannelCreateVariables>(
    (vars) => createChannel(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(realtimeKeys.channels(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create channel: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
