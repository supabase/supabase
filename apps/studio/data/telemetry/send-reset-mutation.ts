import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export async function sendReset() {
  const { data, error } = await post(`/platform/telemetry/reset`, { credentials: 'include' })
  if (error) handleError(error)
  return data
}

type SendResetData = Awaited<ReturnType<typeof sendReset>>

export const useSendResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<SendResetData, ResponseError>, 'mutationFn'> = {}) => {
  return useMutation<SendResetData, ResponseError>((vars) => sendReset(), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        console.error(`Failed to send Telemetry reset: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
