import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { isBrowser } from 'common'
import { handleError, post } from 'data/fetchers'
import { Profile } from 'data/profile/types'
import { useFlag } from 'hooks/ui/useFlag'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import type { ResponseError } from 'types'

type SendIdentifyGA = components['schemas']['TelemetryIdentifyBody']
type SendIdentifyPH = components['schemas']['TelemetryIdentifyBodyV2']

export type SendIdentifyVariables = {
  slug?: string
  ref?: string
  user: Profile
}

type SendIdentifyPayload = any

export async function sendIdentify(type: 'GA' | 'PH', body: SendIdentifyPayload) {
  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return

  const headers = type === 'PH' ? { Version: '2' } : undefined
  const { data, error } = await post(`/platform/telemetry/identify`, {
    body,
    headers,
    credentials: 'include',
  })
  if (error) handleError(error)
  return data
}

type SendIdentifyData = Awaited<ReturnType<typeof sendIdentify>>

export const useSendIdentifyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SendIdentifyData, ResponseError, SendIdentifyVariables>,
  'mutationFn'
> = {}) => {
  const router = useRouter()
  const usePostHogParameters = useFlag('enablePosthogChanges')

  const payload = usePostHogParameters
    ? ({} as SendIdentifyPH)
    : ({
        ga: {
          screen_resolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
          language: router?.locale ?? 'en-US',
        },
      } as SendIdentifyGA)

  return useMutation<SendIdentifyData, ResponseError, SendIdentifyVariables>(
    (vars) => {
      const { user, slug, ref } = vars
      const { disabled_features, ...userInfo } = user
      const type = usePostHogParameters ? 'PH' : 'GA'
      const body = usePostHogParameters
        ? ({
            user_id: user.gotrue_id,
            organization_slug: slug,
            project_ref: ref,
          } as SendIdentifyPH)
        : ({ user: userInfo, ...payload } as SendIdentifyGA)
      return sendIdentify(type, body)
    },
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          console.error(`Failed to send Telemetry identify: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
