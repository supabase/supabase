import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import { captureCriticalError } from '@/lib/error-reporting'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type CreateAccountRecoveryRequestVariables = {
  email: string
  organization: string | undefined
  projectRefs: Array<string> | undefined
  invoices:
    | Array<{
        number: string | undefined
        amount: number | undefined
        issueDate: string | undefined
      }>
    | undefined
  memberEmails: Array<string> | undefined
  notes: string | undefined
  hcaptchaToken: string | null
}

export async function createAccountRecoveryRequest({
  email,
  hcaptchaToken,
  organization,
  projectRefs,
  invoices,
  memberEmails,
  notes,
}: CreateAccountRecoveryRequestVariables) {
  // @ts-ignore
  const { data, error } = await post('/platform/account-recovery/requests', {
    // @ts-ignore
    body: {
      email,
      hcaptchaToken,
      organization,
      projectRefs,
      invoices,
      memberEmails,
      notes,
    },
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
