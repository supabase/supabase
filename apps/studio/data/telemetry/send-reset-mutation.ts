import { useMutation } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export async function sendReset() {
  if (!IS_PLATFORM) return undefined

  const { data, error } = await post(`/platform/telemetry/reset`, {})
  if (error) handleError(error)
  return data
}

type SendResetData = Awaited<ReturnType<typeof sendReset>>

export const useSendResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseCustomMutationOptions<SendResetData, ResponseError>, 'mutationFn'> = {}) => {
  return useMutation<SendResetData, ResponseError>({
    mutationFn: () => sendReset(),
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
