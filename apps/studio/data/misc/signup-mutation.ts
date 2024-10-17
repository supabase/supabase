import * as Sentry from '@sentry/nextjs'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

const WHITELIST_ERRORS = [
  'A user with this email already exists',
  'Password should contain at least one character of each',
  'You attempted to send email to an inactive recipient',
  'email must be an email',
]

export type SignUpVariables = {
  email: string
  password: string
  hcaptchaToken: string | null
  redirectTo: string
}

export async function signup({ email, password, hcaptchaToken, redirectTo }: SignUpVariables) {
  const { data, error } = await post('/platform/signup', {
    // @ts-ignore
    body: { email, password, hcaptchaToken, redirectTo },
  })

  if (error) handleError(error)
  return data
}

type SignUpData = Awaited<ReturnType<typeof signup>>

export const useSignUpMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<SignUpData, ResponseError, SignUpVariables>, 'mutationFn'> = {}) => {
  return useMutation<SignUpData, ResponseError, SignUpVariables>((vars) => signup(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to sign up: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
      if (!WHITELIST_ERRORS.some((error) => data.message.includes(error))) {
        Sentry.captureMessage('[CRITICAL] Failed to sign up: ' + data.message)
      }
    },
    ...options,
  })
}
