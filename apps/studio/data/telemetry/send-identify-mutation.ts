import { createMutation } from 'react-query-kit'

import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

export type SendIdentifyVariables = components['schemas']['TelemetryIdentifyBodyV2']

export async function sendIdentify(variables: SendIdentifyVariables) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

  const headers = { Version: '2' }
  const { data, error } = await post(`/platform/telemetry/identify`, { body: variables, headers })
  if (error) handleError(error)
  return data
}

type SendIdentifyData = Awaited<ReturnType<typeof sendIdentify>>

export const useSendIdentifyMutation = createMutation<
  SendIdentifyData,
  SendIdentifyVariables,
  ResponseError
>({
  mutationFn: sendIdentify,
  onError(data) {
    console.error(`Failed to send Telemetry identify: ${data.message}`)
  },
})
