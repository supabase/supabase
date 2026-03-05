import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { captureCriticalError } from 'lib/error-reporting'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type ResetPasswordVariables = {
  email: string
  hcaptchaToken: string | null
  redirectTo: string
}

export async function resetPassword({ email, hcaptchaToken, redirectTo }: ResetPasswordVariables) {
  const { data, error } = await post('/platform/reset-password', {
    // @ts-ignore
    body: { email, hcaptchaToken, redirectTo },
  })

  if (error) handleError(error)
  return data
}

type ResetPasswordData = Awaited<ReturnType<typeof resetPassword>>

export const useResetPasswordMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ResetPasswordData, ResponseError, ResetPasswordVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ResetPasswordData, ResponseError, ResetPasswordVariables>({
    mutationFn: (vars) => resetPassword(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to reset password: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
      captureCriticalError(data, 'send reset password email')
    },
    ...options,
  })
}
