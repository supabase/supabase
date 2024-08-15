import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'

export type UserDeleteMFAFactorsVariables = {
  projectRef: string
  userId: string
}

export async function deleteMFAFactors({ projectRef, userId }: UserDeleteMFAFactorsVariables) {
  const response = await delete_(`${API_URL}/auth/${projectRef}/users/${userId}/factors`)
  if (response.error) throw response.error
  return response
}

type UserDeleteMFAFactorsData = Awaited<ReturnType<typeof deleteMFAFactors>>

export const useUserDeleteMFAFactorsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserDeleteMFAFactorsData, ResponseError, UserDeleteMFAFactorsVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserDeleteMFAFactorsData, ResponseError, UserDeleteMFAFactorsVariables>(
    (vars) => deleteMFAFactors(vars),
    {
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
    }
  )
}
