import * as Sentry from '@sentry/nextjs'
import type { AuthMFAVerifyResponse, MFAChallengeWebauthnParams } from '@supabase/auth-js'
import { UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'

const WHITELIST_ERRORS = ['Invalid TOTP code entered']

export const mfaAuthenticateWebAuthn = async (params: MFAChallengeWebauthnParams) => {
  const { error, data } = await auth.mfa.webauthn.authenticate(params)
  if (error) throw error
  return data
}

type CustomMFAVerifyResponse = NonNullable<AuthMFAVerifyResponse['data']>
type CustomMFAVerifyError = NonNullable<AuthMFAVerifyResponse['error']>

export const useMfaAuthenticateWebAuthnMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CustomMFAVerifyResponse, CustomMFAVerifyError, MFAChallengeWebauthnParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation(mfaAuthenticateWebAuthn, {
    async onSuccess(data, variables, context) {
      await Promise.all([queryClient.invalidateQueries(profileKeys.aaLevel())])
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
  })
}
