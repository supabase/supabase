import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { AccessToken } from './access-tokens-query'
import { accessTokenKeys } from './keys'

export type AccessTokenCreateVariables = {
  name: string
}

export type NewAccessToken = AccessToken & { token: string }

export async function createAccessToken({ name }: AccessTokenCreateVariables) {
  const response = await post(`${API_URL}/profile/access-tokens`, { name })
  if (response.error) {
    throw response.error
  }

  return response as NewAccessToken
}

type AccessTokenCreateData = Awaited<ReturnType<typeof createAccessToken>>

export const useAccessTokenCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<AccessTokenCreateData, unknown, AccessTokenCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AccessTokenCreateData, unknown, AccessTokenCreateVariables>(
    (vars) => createAccessToken(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(accessTokenKeys.list())

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
