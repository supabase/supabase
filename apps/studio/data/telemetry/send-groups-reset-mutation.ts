import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { ResponseError } from 'types'

export type SendGroupsResetVariables = components['schemas']['TelemetryGroupsResetBody']

export async function sendGroupsReset({
  consent,
  body,
}: {
  consent: boolean
  body: SendGroupsResetVariables
}) {
  if (!consent) return undefined

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
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT_PH)
      : null) === 'true'

  return useMutation<SendGroupsResetData, ResponseError, SendGroupsResetVariables>(
    (vars) => sendGroupsReset({ consent, body: vars }),
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
