import { createMutation } from 'react-query-kit'

import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

export type SendGroupsResetVariables = components['schemas']['TelemetryGroupsResetBody']

export async function sendGroupsReset(body: SendGroupsResetVariables) {
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

export const useSendGroupsResetMutation = createMutation<
  SendGroupsResetData,
  SendGroupsResetVariables,
  ResponseError
>({
  mutationFn: sendGroupsReset,
  onError(data) {
    console.error(`Failed to send Telemetry groups reset: ${data.message}`)
  },
})
