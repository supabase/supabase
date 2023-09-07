import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { ResponseError } from 'types'

export type ApiAuthorizationDeclineVariables = {
  id: string
}

export type ApiAuthorizationDeclineResponse = {
  id: string
}

export async function declineApiAuthorization({ id }: ApiAuthorizationDeclineVariables) {
  if (!id) throw new Error('Authorization ID is required')

  const response = await delete_(`${API_ADMIN_URL}/oauth/authorizations/${id}`, {})
  if (response.error) throw response.error
  return response as ApiAuthorizationDeclineResponse
}

type ApiAuthorizationDeclineData = Awaited<ReturnType<typeof declineApiAuthorization>>

export const useApiAuthorizationDeclineMutation = ({
  onError,
  ...options
}: Omit<
  UseMutationOptions<ApiAuthorizationDeclineData, ResponseError, ApiAuthorizationDeclineVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ApiAuthorizationDeclineData, ResponseError, ApiAuthorizationDeclineVariables>(
    (vars) => declineApiAuthorization(vars),
    {
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to decline authorization request: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
