import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { isBrowser } from 'common'
import { handleError, post } from 'data/fetchers'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

type SendPagePH = components['schemas']['TelemetryPageBodyV2']

export type SendPageVariables = {
  url: string
}

type SendPagePayload = any

export async function sendPage({ consent, body }: { consent: boolean; body: SendPagePayload }) {
  if (!consent) return undefined

  const headers = { Version: '2' }
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

  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  return useMutation<SendPageData, ResponseError, SendPageVariables>(
    (vars) => {
      const { url } = vars
      const type = 'PH'
      const body: SendPagePH = {
        page_url: url,
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
      return sendPage({ consent, body })
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
