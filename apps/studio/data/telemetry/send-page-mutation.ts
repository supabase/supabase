import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { isBrowser, LOCAL_STORAGE_KEYS, useFeatureFlags } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

export type SendPageVariables = {
  url: string
}

type SendPageBody = components['schemas']['TelemetryPageBodyV2Dto']

export async function sendPage({ body }: { body: SendPageBody }) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return

  const { error } = await post(`/platform/telemetry/page`, {
    body,
    headers: { Version: '2' },
  })
  if (error) handleError(error)
}

type SendPageData = Awaited<ReturnType<typeof sendPage>>

export const useSendPageMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<SendPageData, ResponseError, SendPageVariables>, 'mutationFn'> = {}) => {
  const router = useRouter()
  const flagStore = useFeatureFlags()

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  return useMutation<SendPageData, ResponseError, SendPageVariables>(
    (vars) => {
      const { url } = vars
      const body: SendPageBody = {
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
        feature_flags: flagStore.posthog,
      }
      return sendPage({ body })
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
