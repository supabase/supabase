import { createMutation } from 'react-query-kit'

import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

export type SendGroupsIdentifyVariables = components['schemas']['TelemetryGroupsIdentityBody']

export async function sendGroupsIdentify(body: SendGroupsIdentifyVariables) {
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

export const useSendGroupsIdentifyMutation = createMutation<
  SendGroupsIdentifyData,
  SendGroupsIdentifyVariables,
  ResponseError
>({
  mutationFn: sendGroupsIdentify,
  onError(data) {
    console.error(`Failed to send Telemetry groups identify: ${data.message}`)
  },
})
