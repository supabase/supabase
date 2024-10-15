import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { handleError, post } from 'data/fetchers'
import { useFlag } from 'hooks/ui/useFlag'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

type SendPageLeaveBody = components['schemas']['TelemetryPageLeaveBody']

export async function sendPageLeave({
  consent,
  body,
}: {
  consent: boolean
  body: SendPageLeaveBody
}) {
  if (!consent) return undefined

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
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT_PH)
      : null) === 'true'

  const url = typeof window !== 'undefined' ? window.location.href : ''
  const title = typeof document !== 'undefined' ? document?.title : ''

  const body = {
    page_url: url,
    page_title: title,
    pathname: router.pathname,
  } as SendPageLeaveBody

  return useMutation<SendPageLeaveData, ResponseError>((vars) => sendPageLeave({ consent, body }), {
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
