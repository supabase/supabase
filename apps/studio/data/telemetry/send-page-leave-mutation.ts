import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

type SendPageLeaveBody = components['schemas']['TelemetryPageLeaveBody']

export async function sendPageLeave({ body }: { body: SendPageLeaveBody }) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

  const { data, error } = await post(`/platform/telemetry/page-leave`, {
    body,
    credentials: 'include',
  })
  if (error) handleError(error)
  return data
}

type SendPageLeaveData = Awaited<ReturnType<typeof sendPageLeave>>

export const useSendPageLeaveMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<SendPageLeaveData, ResponseError>, 'mutationFn'> = {}) => {
  const router = useRouter()

  const url = typeof window !== 'undefined' ? window.location.href : ''
  const title = typeof document !== 'undefined' ? document?.title : ''

  const body = {
    page_url: url,
    page_title: title,
    pathname: router.pathname,
  } as SendPageLeaveBody

  return useMutation<SendPageLeaveData, ResponseError>((vars) => sendPageLeave({ body }), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        console.error(`Failed to send Telemetry page leave: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
