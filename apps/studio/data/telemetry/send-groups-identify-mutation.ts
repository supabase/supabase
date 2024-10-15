import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { ResponseError } from 'types'

export type SendGroupsIdentifyVariables = components['schemas']['TelemetryGroupsIdentityBody']

export async function sendGroupsIdentify({
  consent,
  body,
}: {
  consent: boolean
  body: SendGroupsIdentifyVariables
}) {
  if (!consent) return undefined

  const { data, error } = await post(`/platform/telemetry/groups/identify`, {
    body,
    credentials: 'include',
  })
  if (error) handleError(error)
  return data
}

type SendGroupsIdentifyData = Awaited<ReturnType<typeof sendGroupsIdentify>>

export const useSendGroupsIdentifyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SendGroupsIdentifyData, ResponseError, SendGroupsIdentifyVariables>,
  'mutationFn'
> = {}) => {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT_PH)
      : null) === 'true'

  return useMutation<SendGroupsIdentifyData, ResponseError, SendGroupsIdentifyVariables>(
    (vars) => sendGroupsIdentify({ consent, body: vars }),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          console.error(`Failed to send Telemetry groups identify: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
