import * as Sentry from '@sentry/nextjs'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

const WHITELIST_ERRORS = ['email must be an email']

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
  UseMutationOptions<ResetPasswordData, ResponseError, ResetPasswordVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ResetPasswordData, ResponseError, ResetPasswordVariables>(
    (vars) => resetPassword(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to reset password: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
        if (!WHITELIST_ERRORS.some((error) => data.message.includes(error))) {
          Sentry.captureMessage('[CRITICAL] Failed to send reset password email: ' + data.message)
        }
      },
      ...options,
    }
  )
}
