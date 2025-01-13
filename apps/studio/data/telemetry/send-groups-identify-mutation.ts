import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

export type SendGroupsIdentifyVariables = components['schemas']['TelemetryGroupsIdentityBody']

export async function sendGroupsIdentify({ body }: { body: SendGroupsIdentifyVariables }) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

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
  return useMutation<SendGroupsIdentifyData, ResponseError, SendGroupsIdentifyVariables>(
    (vars) => sendGroupsIdentify({ body: vars }),
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
