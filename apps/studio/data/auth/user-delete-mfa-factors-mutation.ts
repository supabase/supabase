import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type UserDeleteMFAFactorsVariables = {
  projectRef: string
  userId: string
}

export async function deleteMFAFactors({ projectRef, userId }: UserDeleteMFAFactorsVariables) {
  const { data, error } = await del('/platform/auth/{ref}/users/{id}/factors', {
    params: { path: { ref: projectRef, id: userId } },
  })

  if (error) handleError(error)

  return data
}

type UserDeleteMFAFactorsData = Awaited<ReturnType<typeof deleteMFAFactors>>

export const useUserDeleteMFAFactorsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UserDeleteMFAFactorsData, ResponseError, UserDeleteMFAFactorsVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserDeleteMFAFactorsData, ResponseError, UserDeleteMFAFactorsVariables>({
    mutationFn: (vars) => deleteMFAFactors(vars),
    async onSuccess(data, variables, context) {
      // [Joshen] If we need to invalidate any queries
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete the user's MFA factors: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
