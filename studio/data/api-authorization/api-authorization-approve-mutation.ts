import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'

export type ApiAuthorizationApproveVariables = {
  id: string
  organization_id: string
}

export type ApiAuthorizationApproveResponse = {
  url: string
}

export async function approveApiAuthorization({
  id,
  organization_id,
}: ApiAuthorizationApproveVariables) {
  if (!id) throw new Error('Authorization ID is required')
  if (!organization_id) throw new Error('Organization slug is required')

  const response = await post(
    `${API_ADMIN_URL}/oauth/authorizations/${id}?skip_browser_redirect=true`,
    { organization_id }
  )
  if (response.error) throw response.error
  return response as ApiAuthorizationApproveResponse
}

type ApiAuthorizationApproveData = Awaited<ReturnType<typeof approveApiAuthorization>>

export const useApiAuthorizationApproveMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ApiAuthorizationApproveData, unknown, ApiAuthorizationApproveVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ApiAuthorizationApproveData, unknown, ApiAuthorizationApproveVariables>(
    (vars) => approveApiAuthorization(vars),
    options
  )
}
