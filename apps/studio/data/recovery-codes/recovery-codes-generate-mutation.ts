import type {
  AuthMFARecoveryCodesGenerateResponse,
  MFARecoveryCodesGenerateParams,
} from '@supabase/auth-js'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { captureCriticalError } from '@/lib/error-reporting'
import { auth } from '@/lib/gotrue'
import { UseCustomMutationOptions } from '@/types'

export const recoveryCodesGenerate = async (params: MFARecoveryCodesGenerateParams) => {
  const { error, data } = await auth.mfa.recoveryCodes.generate(params)
  if (error) throw error
  return data
}

type RecoveryCodesGenerateResponse = NonNullable<AuthMFARecoveryCodesGenerateResponse['data']>
type RecoveryCodesGenerateError = NonNullable<AuthMFARecoveryCodesGenerateResponse['error']>

export const useRecoveryCodesGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    RecoveryCodesGenerateResponse,
    RecoveryCodesGenerateError,
    MFARecoveryCodesGenerateParams
  >,
  'mutationFn'
> = {}) => {
  return useMutation({
    mutationFn: (vars) => {
      return recoveryCodesGenerate(vars)
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to sign in: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
      captureCriticalError(data, 'sign in via MFA')
    },
    ...options,
  })
}
