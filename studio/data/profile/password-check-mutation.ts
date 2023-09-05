import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'

export type PasswordCheckVariables = {
  password: string
}

export async function checkPasswordStrength({ password }: PasswordCheckVariables) {
  const { data, error } = await post('/platform/profile/password-check', { body: { password } })
  if (error) throw error
  return data
}

type PasswordCheckData = Awaited<ReturnType<typeof checkPasswordStrength>>

export const usePasswordCheckMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<PasswordCheckData, ResponseError, PasswordCheckVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<PasswordCheckData, ResponseError, PasswordCheckVariables>(
    (vars) => checkPasswordStrength(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to check password: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
