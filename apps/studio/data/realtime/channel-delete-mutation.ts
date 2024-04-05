import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import type { ResponseError } from 'types'
import { realtimeKeys } from './keys'

export type ChannelDeleteVariables = {
  projectRef: string
  endpoint: string
  accessToken: string
  name: string
}

const deleteChannel = async ({ endpoint, accessToken, name }: ChannelDeleteVariables) => {
  const response = await delete_(
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
  return name
}

type ChannelDeleteData = Awaited<ReturnType<typeof deleteChannel>>

export const useChannelDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ChannelDeleteData, ResponseError, ChannelDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ChannelDeleteData, ResponseError, ChannelDeleteVariables>(
    (vars) => deleteChannel(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(realtimeKeys.channels(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete channel: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
