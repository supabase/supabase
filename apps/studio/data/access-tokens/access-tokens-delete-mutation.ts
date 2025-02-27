import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { accessTokenKeys } from './keys'

export type AccessTokenDeleteVariables = {
  id: number
}

export async function deleteAccessToken({ id }: AccessTokenDeleteVariables) {
  const { data, error } = await del('/platform/profile/access-tokens/{id}', {
    params: { path: { id } },
  })

  if (error) handleError(error)

  return data
}

type AccessTokenDeleteData = Awaited<ReturnType<typeof deleteAccessToken>>

export const useAccessTokenDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AccessTokenDeleteData, ResponseError, AccessTokenDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AccessTokenDeleteData, ResponseError, AccessTokenDeleteVariables>(
    (vars) => deleteAccessToken(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(accessTokenKeys.list())

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete access token: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
