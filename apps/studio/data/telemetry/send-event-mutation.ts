import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { isBrowser } from 'common'
import { handleError, post } from 'data/fetchers'
import { useFlag } from 'hooks/ui/useFlag'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

type SendEventGA = {
  action: string
  category: string
  label: string
  value: string
  page_referrer: string
  page_title: string
  page_location: string
  ga: {
    screen_resolution: string
    language: string
  }
}

type SendEventPH = {
  action: string
  page_url: string
  page_title: string
  pathname: string
  ph: {
    language: string
    referrer: string
    userAgent: string
    search: string
    viewport_height: number
    viewport_width: number
  }
  custom_properties: { [key: string]: string }
}

export type SendEventVariables = {
  action: string
  category: string
  label: string
  value?: string
}

type SendEventPayload = any

export async function sendEvent(type: 'GA' | 'PH', body: SendEventPayload) {
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

  const payload = usePostHogParameters
    ? ({
        page_url: window.location.href,
        page_title: document?.title,
        pathname: router.pathname,
        ph: {
          language: router?.locale ?? 'en-US',
          referrer: document?.referrer,
          userAgent: navigator.userAgent,
          search: window.location.search,
          viewport_height: isBrowser ? window.innerHeight : 0,
          viewport_width: isBrowser ? window.innerWidth : 0,
        },
        custom_properties: {},
      } as SendEventPH)
    : ({
        page_referrer: document?.referrer,
        page_title: document?.title,
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
            ...(payload as Omit<SendEventPH, 'action'>),
            custom_properties: otherVars,
          } as SendEventPH)
        : ({ ...vars, ...payload } as SendEventGA)
      return sendEvent(type, body)
    },
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to send Telemetry event: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
