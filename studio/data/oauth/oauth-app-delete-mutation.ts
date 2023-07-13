import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { oauthAppKeys } from './keys'

export type OAuthAppDeleteVariables = {
  id: string
  slug: string
}

export async function deleteOAuthApp({ id, slug }: OAuthAppDeleteVariables) {
  if (!id) throw new Error('OAuth app ID is required')
  if (!slug) throw new Error('Organization slug is required')

  const response = await delete_(
    `${API_ADMIN_URL}/organizations/${slug}/oauth/apps/${id}?type=published`
  )
  if (response.error) throw response.error
  return response
}

type OAuthAppDeleteData = Awaited<ReturnType<typeof deleteOAuthApp>>

export const useOAuthAppDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<OAuthAppDeleteData, unknown, OAuthAppDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppDeleteData, unknown, OAuthAppDeleteVariables>(
    (vars) => deleteOAuthApp(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables
        await queryClient.invalidateQueries(oauthAppKeys.oauthApps(slug))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
