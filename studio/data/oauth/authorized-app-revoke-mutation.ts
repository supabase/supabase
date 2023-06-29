import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { oauthAppKeys } from './keys'

export type AuthorizedAppRevokeVariables = {
  id: string
  slug: string
}

export async function revokeAuthorizedApp({ id, slug }: AuthorizedAppRevokeVariables) {
  if (!id) throw new Error('App ID is required')
  if (!slug) throw new Error('Organization slug is required')

  const response = await delete_(
    `${API_ADMIN_URL}/organizations/${slug}/oauth/apps/${id}?type=authorized`
  )
  if (response.error) throw response.error
  return response
}

type AuthorizedAppRevokeData = Awaited<ReturnType<typeof revokeAuthorizedApp>>

export const useAuthorizedAppRevokeMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<AuthorizedAppRevokeData, unknown, AuthorizedAppRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthorizedAppRevokeData, unknown, AuthorizedAppRevokeVariables>(
    (vars) => revokeAuthorizedApp(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables
        await queryClient.invalidateQueries(oauthAppKeys.authorizedApps(slug))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
