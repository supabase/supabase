import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { oauthAppKeys } from './keys'

export type OAuthAppCreateVariables = {
  slug: string
  name: string
  website: string
  icon?: string
  redirect_uris: string[]
}

export type OAuthAppCreateResponse = {
  id: string
  client_id: string
  client_secret: string
}

export async function createOAuthApp({
  slug,
  name,
  website,
  icon,
  redirect_uris,
}: OAuthAppCreateVariables) {
  if (!slug) throw new Error('Organization slug is required')
  if (!name) throw new Error('OAuth app name is required')
  if (!website) throw new Error('OAuth app URL is required')

  const response = await post(`${API_ADMIN_URL}/organizations/${slug}/oauth/apps`, {
    name,
    website,
    icon,
    redirect_uris,
  })
  if (response.error) throw response.error
  return response as OAuthAppCreateResponse
}

type OAuthAppCreateData = Awaited<ReturnType<typeof createOAuthApp>>

export const useOAuthAppCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<OAuthAppCreateData, unknown, OAuthAppCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppCreateData, unknown, OAuthAppCreateVariables>(
    (vars) => createOAuthApp(vars),
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
