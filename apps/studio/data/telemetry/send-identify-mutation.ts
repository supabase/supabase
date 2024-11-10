import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { Profile } from 'data/profile/types'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

type SendIdentify = components['schemas']['TelemetryIdentifyBodyV2']

export type SendIdentifyVariables = {
  slug?: string
  ref?: string
  user: Profile
}

type SendIdentifyPayload = any

export async function sendIdentify({ body }: { body: SendIdentifyPayload }) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

  const headers = { Version: '2' }
  const { data, error } = await post(`/platform/telemetry/identify`, { body, headers })
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
  return useMutation<SendIdentifyData, ResponseError, SendIdentifyVariables>(
    (vars) => {
      const { user, slug, ref } = vars

      const body: SendIdentify = {
        user_id: user.gotrue_id,
        organization_slug: slug,
        project_ref: ref,
      }

      return sendIdentify({ body })
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
