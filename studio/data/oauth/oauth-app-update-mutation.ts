import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { put } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { oauthAppKeys } from './keys'

export type OAuthAppUpdateVariables = {
  id: string
  slug: string
  name: string
  website: string
  icon?: string | null
  redirect_uris: string[]
}

export async function updateOAuthApp({
  id,
  slug,
  name,
  website,
  icon,
  redirect_uris,
}: OAuthAppUpdateVariables) {
  if (!id) throw new Error('OAuth app ID is required')
  if (!slug) throw new Error('Organization slug is required')
  if (!name) throw new Error('OAuth app name is required')
  if (!website) throw new Error('OAuth app URL is required')
  if (!redirect_uris || redirect_uris.length === 0) throw new Error('Redirect URIs are required')

  const response = await put(`${API_ADMIN_URL}/organizations/${slug}/oauth/apps/${id}`, {
    name,
    website,
    icon,
    redirect_uris,
  })
  if (response.error) throw response.error
  return response
}

type OAuthAppUpdateData = Awaited<ReturnType<typeof updateOAuthApp>>

export const useOAuthAppUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<OAuthAppUpdateData, unknown, OAuthAppUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppUpdateData, unknown, OAuthAppUpdateVariables>(
    (vars) => updateOAuthApp(vars),
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
