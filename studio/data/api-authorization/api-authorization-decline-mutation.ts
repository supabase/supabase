import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'

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
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ApiAuthorizationDeclineData, unknown, ApiAuthorizationDeclineVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ApiAuthorizationDeclineData, unknown, ApiAuthorizationDeclineVariables>(
    (vars) => declineApiAuthorization(vars),
    options
  )
}
