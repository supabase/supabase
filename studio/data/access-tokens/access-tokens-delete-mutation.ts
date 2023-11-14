import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { delete_, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { accessTokenKeys } from './keys'

export type AccessTokenDeleteVariables = {
  id: number
}

export async function deleteAccessToken({ id }: AccessTokenDeleteVariables) {
  const response = await delete_<void>(`${API_URL}/profile/access-tokens/${id}`)

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
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
