import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { accessTokenKeys } from './keys'

export type AccessTokenDeleteVariables = {
  id: number
}

export async function deleteAccessToken({ id }: AccessTokenDeleteVariables) {
  const response = await delete_(`${API_URL}/profile/access-tokens/${id}`)
  if (response.error) {
    throw response.error
  }

  return response
}

type AccessTokenDeleteData = Awaited<ReturnType<typeof deleteAccessToken>>

export const useAccessTokenDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<AccessTokenDeleteData, unknown, AccessTokenDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AccessTokenDeleteData, unknown, AccessTokenDeleteVariables>(
    (vars) => deleteAccessToken(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(accessTokenKeys.list())

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
