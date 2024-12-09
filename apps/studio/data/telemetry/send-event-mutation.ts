import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { isBrowser, LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

type SendEvent = components['schemas']['TelemetryEventBodyV2']

export type SendEventVariables = {
  /** Defines the name of the event, refer to TELEMETRY_EVENTS in lib/constants */
  action: string
  /** These are all under the event's properties (customizable on the FE) */
  /** value: refer to TELEMETRY_VALUES in lib/constants */
  value?: string
  /** label: secondary tag to the event for further identification */
  label?: string
  /** To deprecate - seems unnecessary */
  category?: string
  properties?: Record<string, any>
}

type SendEventPayload = any

export async function sendEvent({ body }: { body: SendEventPayload }) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

  const headers = { Version: '2' }
  const { data, error } = await post(`/platform/telemetry/event`, { body, headers })
  if (error) handleError(error)
  return data
}

type SendEventData = Awaited<ReturnType<typeof sendEvent>>

export const useSendEventMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SendEventData, ResponseError, SendEventVariables>,
  'mutationFn'
> = {}) => {
  const router = useRouter()

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  return useMutation<SendEventData, ResponseError, SendEventVariables>(
    (vars) => {
      const { action, ...otherVars } = vars

      const body: SendEvent = {
        action,
        page_url: window.location.href,
        page_title: title,
        pathname: router.pathname,
        ph: {
          referrer,
          language: router?.locale ?? 'en-US',
          user_agent: navigator.userAgent,
          search: window.location.search,
          viewport_height: isBrowser ? window.innerHeight : 0,
          viewport_width: isBrowser ? window.innerWidth : 0,
        },
        // @ts-expect-error - API is returning a wrong type
        custom_properties: otherVars,
      }

      return sendEvent({ body })
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
