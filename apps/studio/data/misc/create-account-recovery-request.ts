import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import { captureCriticalError } from '@/lib/error-reporting'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type CreateAccountRecoveryRequestVariables = {
  email: string
  hcaptchaToken: string | null
  redirectTo: string
}

export async function createAccountRecoveryRequest({
  email,
  hcaptchaToken,
  redirectTo,
}: CreateAccountRecoveryRequestVariables) {
  // @ts-ignore
  const { data, error } = await post('/platform/account-recovery/requests', {
    // @ts-ignore
    body: { email, hcaptchaToken, redirectTo },
  })

  if (error) handleError(error)
  return data
}

type ResetPasswordData = Awaited<ReturnType<typeof createAccountRecoveryRequest>>

export const useCreateAccountRecoveryRequestMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ResetPasswordData, ResponseError, CreateAccountRecoveryRequestVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ResetPasswordData, ResponseError, CreateAccountRecoveryRequestVariables>({
    mutationFn: (vars) => createAccountRecoveryRequest(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create account recovery request: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
      captureCriticalError(data, 'create account recovery request')
    },
    ...options,
  })
}
