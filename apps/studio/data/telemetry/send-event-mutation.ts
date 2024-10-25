import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { isBrowser } from 'common'
import { handleError, post } from 'data/fetchers'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

type SendEvent = components['schemas']['TelemetryEventBodyV2']

export type SendEventVariables = {
  action: string
  category: string
  label: string
  value?: string
}

type SendEventPayload = any

export async function sendEvent({ body }: { body: SendEventPayload }) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent) return undefined

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
