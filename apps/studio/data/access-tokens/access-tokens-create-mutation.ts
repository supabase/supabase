import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { isResponseOk, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import type { AccessToken } from './access-tokens-query'
import { accessTokenKeys } from './keys'

export type AccessTokenCreateVariables = {
  name: string
  scope: 'V0' | undefined
}

export type NewAccessToken = AccessToken & { token: string }

export async function createAccessToken({ name, scope }: AccessTokenCreateVariables) {
  const response = await post<NewAccessToken>(`${API_URL}/profile/access-tokens`, { name, scope })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type AccessTokenCreateData = Awaited<ReturnType<typeof createAccessToken>>

export const useAccessTokenCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AccessTokenCreateData, ResponseError, AccessTokenCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AccessTokenCreateData, ResponseError, AccessTokenCreateVariables>(
    (vars) => createAccessToken(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(accessTokenKeys.list())

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create access token: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
