import type { AuthError } from '@supabase/auth-js'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { profileKeys } from './keys'
import { auth } from '@/lib/gotrue'

export type SetPasswordVariables = {
  password: string
}

async function setPassword({ password }: SetPasswordVariables) {
  const { data, error } = await auth.updateUser({ password })

  if (error) throw error
  return data
}

export type SetPasswordData = Awaited<ReturnType<typeof setPassword>>
export type SetPasswordError = AuthError

export const useSetPasswordMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SetPasswordData, SetPasswordError, SetPasswordVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars) => setPassword(vars),
    async onSuccess(data, variables, context) {
      // logout all other sessions after setting a password
      await auth.signOut({ scope: 'others' })
      await Promise.all([
        auth.refreshSession(),
        queryClient.invalidateQueries({ queryKey: profileKeys.identities() }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to add password: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
