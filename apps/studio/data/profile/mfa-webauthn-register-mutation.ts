import * as Sentry from '@sentry/nextjs'
import type { AuthMFAVerifyResponse } from '@supabase/auth-js'
import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'

// Defining here as it's not exported by @supabase/auth-js
interface MFAVerifyWebauthnParams {
  friendlyName: string
  /** Relying party ID */
  rpId: string
  /** Relying party origins */
  rpOrigins?: string[]
  refreshFactors?: boolean
}

export const mfaWebAuthnRegister = async (params: MFAVerifyWebauthnParams) => {
  const { error, data } = await auth.mfa.webauthn.register(params, {
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform', // Allow both platform and cross-platform
      residentKey: 'discouraged',
      userVerification: 'preferred',
      requireResidentKey: false,
    },
  })

  if (error) throw error
  return data
}

type CustomMFAVerifyResponse = NonNullable<AuthMFAVerifyResponse['data']>
type CustomMFAVerifyError = NonNullable<AuthMFAVerifyResponse['error']>

export const useMfaWebAuthnRegisterMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CustomMFAVerifyResponse, CustomMFAVerifyError, MFAVerifyWebauthnParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    (vars) => {
      return mfaWebAuthnRegister(vars)
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

        Sentry.captureMessage('Failed to sign in via WebAuthn MFA: ' + data.message)
      },
      ...options,
    }
  )
}
