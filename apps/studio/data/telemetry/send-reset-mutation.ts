import { createMutation } from 'react-query-kit'

import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

export async function sendReset() {
  if (!IS_PLATFORM) return undefined

  const { data, error } = await post(`/platform/telemetry/reset`, {})
  if (error) handleError(error)
  return data
}

type SendResetData = Awaited<ReturnType<typeof sendReset>>

export const useSendResetMutation = createMutation<SendResetData, void, ResponseError>({
  mutationFn: sendReset,
  async onError(data) {
    console.error(`Failed to send Telemetry reset: ${data.message}`)
  },
})
