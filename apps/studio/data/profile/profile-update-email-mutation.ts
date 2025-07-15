import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from 'data/fetchers'
import { auth } from 'lib/gotrue'
import type { ResponseError } from 'types'
import { profileKeys } from './keys'

export type EmailUpdateVariables = {
  email: string
  hcaptchaToken: string | null
}

export async function updateEmail({ email, hcaptchaToken }: EmailUpdateVariables) {
  const { data, error } = await put('/platform/update-email', {
    body: { newEmail: email, hcaptchaToken },
  })

  if (error) handleError(error)
  return data
}

type EmailUpdateData = Awaited<ReturnType<typeof updateEmail>>

export const useEmailUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EmailUpdateData, ResponseError, EmailUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EmailUpdateData, ResponseError, EmailUpdateVariables>(
    (vars) => updateEmail(vars),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          auth.refreshSession(),
          queryClient.invalidateQueries(profileKeys.profile()),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update email: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
