import * as Sentry from '@sentry/nextjs'
import type { AuthMFAVerifyResponse, MFAChallengeAndVerifyParams } from '@supabase/supabase-js'
import { UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'

const WHITELIST_ERRORS = ['Invalid TOTP code entered']

interface MFAChallengeAndVerifyVariables extends MFAChallengeAndVerifyParams {
  refreshFactors?: boolean
}

export const mfaChallengeAndVerify = async (params: MFAChallengeAndVerifyParams) => {
  const { error, data } = await auth.mfa.challengeAndVerify(params)
  if (error) throw error
  return data
}

type CustomMFAVerifyResponse = NonNullable<AuthMFAVerifyResponse['data']>
type CustomMFAVerifyError = NonNullable<AuthMFAVerifyResponse['error']>

export const useMfaChallengeAndVerifyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CustomMFAVerifyResponse, CustomMFAVerifyError, MFAChallengeAndVerifyVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    (vars) => {
      const { refreshFactors, ...params } = vars
      return mfaChallengeAndVerify(params)
    },
    {
      async onSuccess(data, variables, context) {
        // when a MFA is added, the aaLevel is bumped up
        const refreshFactors = variables.refreshFactors ?? true

        await Promise.all([
          ...(refreshFactors ? [queryClient.invalidateQueries(profileKeys.mfaFactors())] : []),
          queryClient.invalidateQueries(profileKeys.aaLevel()),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to sign in: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
        if (!WHITELIST_ERRORS.some((error) => data.message.includes(error))) {
          Sentry.captureMessage('[CRITICAL] Failed to sign in via MFA: ' + data.message)
        }
      },
      ...options,
    }
  )
}
