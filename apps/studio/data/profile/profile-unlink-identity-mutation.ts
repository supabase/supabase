import type { UserIdentity } from '@supabase/supabase-js'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'

const unlinkIdentity = async (identity: UserIdentity) => {
  const { error, data } = await auth.unlinkIdentity(identity)

  if (error) throw error
  return data
}

type UnlinkIdentityResponse = any
type UnlinkIdentityError = any

export const useUnlinkIdentityMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UnlinkIdentityResponse, UnlinkIdentityError, UserIdentity>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation((vars) => unlinkIdentity(vars), {
    async onSuccess(data, variables, context) {
      await Promise.all([
        auth.refreshSession(),
        queryClient.invalidateQueries(profileKeys.identities()),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to unlink identity: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
