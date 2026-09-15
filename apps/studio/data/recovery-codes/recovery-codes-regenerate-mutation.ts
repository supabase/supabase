import type { AuthMFARecoveryCodesGenerateResponse } from '@supabase/auth-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { recoveryCodeKeys } from './keys'
import { captureCriticalError } from '@/lib/error-reporting'
import { auth } from '@/lib/gotrue'
import { UseCustomMutationOptions } from '@/types'

export const recoveryCodesRegenerate = async () => {
  const { error, data } = await auth.mfa.recoveryCodes.regenerate()
  if (error) throw error
  return data
}

type RecoveryCodesRegenerateResponse = NonNullable<AuthMFARecoveryCodesGenerateResponse['data']>
type RecoveryCodesRegenerateError = NonNullable<AuthMFARecoveryCodesGenerateResponse['error']>

export const useRecoveryCodesRegenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<RecoveryCodesRegenerateResponse, RecoveryCodesRegenerateError>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      return recoveryCodesRegenerate()
    },
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: recoveryCodeKeys.status() })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to regenerate recovery codes: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
      captureCriticalError(data, 'recovery codes regenerate')
    },
    ...options,
  })
}
