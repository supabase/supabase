import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type SendGroupsResetVariables = components['schemas']['TelemetryGroupsResetBody']

export async function sendGroupsReset(body: SendGroupsResetVariables) {
  const { data, error } = await post(`/platform/telemetry/groups/reset`, {
    body,
    credentials: 'include',
  })
  if (error) handleError(error)
  return data
}

type SendGroupsResetData = Awaited<ReturnType<typeof sendGroupsReset>>

export const useSendGroupsResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SendGroupsResetData, ResponseError, SendGroupsResetVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SendGroupsResetData, ResponseError, SendGroupsResetVariables>(
    (vars) => sendGroupsReset(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          console.error(`Failed to send Telemetry groups reset: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
