import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { sendTelemetryEvent } from 'common'
import { TelemetryEvent } from 'common/telemetry-constants'
import { handleError } from 'data/fetchers'
import { API_URL } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

interface SendEventVariables {
  event: TelemetryEvent
  pathname?: string
}

export async function sendEvent({ event, pathname }: SendEventVariables) {
  try {
    await sendTelemetryEvent(API_URL, event, pathname)
  } catch (error) {
    handleError(error)
  }
}

type SendEventData = Awaited<ReturnType<typeof sendEvent>>

export const useSendEventMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<SendEventData, ResponseError, TelemetryEvent>, 'mutationFn'> = {}) => {
  const router = useRouter()

  return useMutation<SendEventData, ResponseError, TelemetryEvent>(
    (event) => {
      return sendEvent({ event, pathname: router.pathname })
    },
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          console.error(`Failed to send Telemetry event: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
