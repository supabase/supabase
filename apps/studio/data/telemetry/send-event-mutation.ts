import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { isBrowser } from 'common'
import { handleError, post } from 'data/fetchers'
import { useFlag } from 'hooks/ui/useFlag'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'
import { Telemetry } from 'telemetry'

type SendEventGA = components['schemas']['TelemetryEventBody']
type _SendEventPH = Omit<
  components['schemas']['TelemetryEventBodyV2'],
  'action' | 'custom_properties'
>

type SendEventPH<K extends Telemetry.EventName> = _SendEventPH & {
  action: K
  custom_properties?: Telemetry.EventProperties<K>
}

export type SendEventVariables = Telemetry.EventWithProperties

type SendEventPayload = any

export async function sendEvent({
  consent,
  type,
  body,
}: {
  consent: boolean
  type: 'GA' | 'PH'
  body: SendEventPayload
}) {
  if (!consent) return undefined

  const headers = type === 'PH' ? { Version: '2' } : undefined
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
  const usePostHogParameters = useFlag('enablePosthogChanges')

  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(
          usePostHogParameters
            ? LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT_PH
            : LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT
        )
      : null) === 'true'

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  const payload = usePostHogParameters
    ? {
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
      }
    : ({
        page_referrer: referrer,
        page_title: title,
        page_location: router.asPath.split('#')[0],
        ga: {
          screen_resolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
          language: router?.locale ?? 'en-US',
        },
      } as SendEventGA)

  return useMutation<SendEventData, ResponseError, SendEventVariables>(
    (vars) => {
      const { action, ...otherVars } = vars
      const type = usePostHogParameters ? 'PH' : 'GA'
      const body = usePostHogParameters
        ? ({
            action,
            ...payload,
            custom_properties: otherVars.properties ?? {},
          } as SendEventPH<typeof action>)
        : ({ ...vars, ...payload } as SendEventGA)
      return sendEvent({ consent, type, body })
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
