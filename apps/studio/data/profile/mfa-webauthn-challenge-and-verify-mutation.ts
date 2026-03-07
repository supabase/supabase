import * as Sentry from '@sentry/nextjs'
import type { AuthMFAVerifyResponse, MFAChallengeWebauthnParams } from '@supabase/auth-js'
import { useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { auth } from 'lib/gotrue'
import { toast } from 'sonner'

import { profileKeys } from './keys'

const WHITELIST_ERRORS = ['Invalid TOTP code entered']

interface MFAWebAuthnChallengeAndVerifyVariables extends MFAChallengeWebauthnParams {
  refreshFactors?: boolean
}

export const mfaWebAuthnChallengeAndVerify = async (params: MFAChallengeWebauthnParams) => {
  const challenge = await auth.mfa.webauthn.challenge(params)

  if (challenge.error) {
    throw challenge.error
  }

  const verify = await auth.mfa.webauthn.verify({
    factorId: challenge.data.factorId,
    challengeId: challenge.data.challengeId,
    webauthn: {
      rpId: window.location.hostname,
      rpOrigins: [window.location.origin],
      type: challenge.data.webauthn.type,
      credential_response: challenge.data.webauthn.credential_response,
    },
  })

  if (verify.error) {
    throw verify.error
  }

  return verify.data
}

type CustomMFAVerifyResponse = NonNullable<AuthMFAVerifyResponse['data']>
type CustomMFAVerifyError = NonNullable<AuthMFAVerifyResponse['error']>

export const useMfaWebAuthnChallengeAndVerifyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    CustomMFAVerifyResponse,
    CustomMFAVerifyError,
    MFAWebAuthnChallengeAndVerifyVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: MFAWebAuthnChallengeAndVerifyVariables) => {
      const { refreshFactors: _, ...params } = vars
      return mfaWebAuthnChallengeAndVerify(params)
    },
    async onSuccess(data, variables, context) {
      const refreshFactors = variables.refreshFactors ?? true

      await Promise.all([
        ...(refreshFactors
          ? [queryClient.invalidateQueries({ queryKey: profileKeys.mfaFactors() })]
          : []),
        queryClient.invalidateQueries({ queryKey: profileKeys.aaLevel() }),
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
  })
}
