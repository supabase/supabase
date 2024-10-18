import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { isBrowser } from 'common'
import { handleError, post } from 'data/fetchers'
import { useFlag } from 'hooks/ui/useFlag'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

type SendPageGA = components['schemas']['TelemetryPageBody']
type SendPagePH = components['schemas']['TelemetryPageBodyV2']

export type SendPageVariables = {
  url: string
}

type SendPagePayload = any

export async function sendPage({
  consent,
  type,
  body,
}: {
  consent: boolean
  type: 'GA' | 'PH'
  body: SendPagePayload
}) {
  if (!consent) return undefined

  const headers = type === 'PH' ? { Version: '2' } : undefined
  const { data, error } = await post(`/platform/telemetry/page`, { body, headers })
  if (error) handleError(error)
  return data
}

type SendPageData = Awaited<ReturnType<typeof sendPage>>

export const useSendPageMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<SendPageData, ResponseError, SendPageVariables>, 'mutationFn'> = {}) => {
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
    ? ({
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
      } as SendPagePH)
    : ({
        title,
        referrer,
        ga: {
          screen_resolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
          language: router?.locale ?? 'en-US',
        },
      } as SendPageGA)

  return useMutation<SendPageData, ResponseError, SendPageVariables>(
    (vars) => {
      const { url } = vars
      const type = usePostHogParameters ? 'PH' : 'GA'
      const body = usePostHogParameters
        ? ({ page_url: url, ...payload } as SendPagePH)
        : ({ route: url, ...payload } as SendPageGA)
      return sendPage({ consent, type, body })
    },
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          console.error(`Failed to send Telemetry page: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
