import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

export type SendGroupsResetVariables = components['schemas']['TelemetryGroupsResetBody']

export async function sendGroupsReset({ body }: { body: SendGroupsResetVariables }) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

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
    (vars) => sendGroupsReset({ body: vars }),
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
