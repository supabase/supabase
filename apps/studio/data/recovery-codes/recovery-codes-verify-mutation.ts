import type { AuthMFAVerifyResponse, MFARecoveryCodesVerifyParams } from '@supabase/auth-js'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { captureCriticalError } from '@/lib/error-reporting'
import { auth } from '@/lib/gotrue'
import { UseCustomMutationOptions } from '@/types'

export const recoveryCodesVerify = async (params: MFARecoveryCodesVerifyParams) => {
  const { error, data } = await auth.mfa.recoveryCodes.verify(params)
  if (error) throw error
  return data
}

type RecoveryCodesVerifyResponse = NonNullable<AuthMFAVerifyResponse['data']>
type RecoveryCodesVerifyError = NonNullable<AuthMFAVerifyResponse['error']>

export const useRecoveryCodesVerifyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    RecoveryCodesVerifyResponse,
    RecoveryCodesVerifyError,
    MFARecoveryCodesVerifyParams
  >,
  'mutationFn'
> = {}) => {
  return useMutation({
    mutationFn: (vars) => {
      return recoveryCodesVerify(vars)
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to verify recovery code: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
      captureCriticalError(data, 'recovery code verify')
    },
    ...options,
  })
}
