import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
// import { resourceKeys } from './keys'

export type ApiAuthorizationApproveVariables = {
  id: string
}

export async function approveApiAuthorization({ id }: ApiAuthorizationApproveVariables) {
  if (!id) throw new Error('Authorization ID is required')

  const response = await post(
    `${API_ADMIN_URL}/oauth/authorization/${id}?skip_browser_redirect=true`,
    {}
  )
  if (response.error) throw response.error
  return response
}

type ApiAuthorizationApproveData = Awaited<ReturnType<typeof approveApiAuthorization>>

export const useApiAuthorizationApproveMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ApiAuthorizationApproveData, unknown, ApiAuthorizationApproveVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ApiAuthorizationApproveData, unknown, ApiAuthorizationApproveVariables>(
    (vars) => approveApiAuthorization(vars),
    {
      async onSuccess(data, variables, context) {
        // const { id } = variables
        // await queryClient.invalidateQueries(networkRestrictionKeys.list(projectRef))
        // await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
