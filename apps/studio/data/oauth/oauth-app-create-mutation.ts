import type { OAuthScope } from '@supabase/shared-types/out/constants'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import { oauthAppKeys } from './keys'

export type OAuthAppCreateVariables = {
  slug: string
  name: string
  website: string
  icon?: string
  scopes?: OAuthScope[]
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
  scopes,
  redirect_uris,
}: OAuthAppCreateVariables) {
  const response = await post(`${API_URL}/organizations/${slug}/oauth/apps`, {
    name,
    website,
    icon,
    scopes,
    redirect_uris,
  })
  if (response.error) throw response.error
  return response as OAuthAppCreateResponse
}

type OAuthAppCreateData = Awaited<ReturnType<typeof createOAuthApp>>

export const useOAuthAppCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OAuthAppCreateData, ResponseError, OAuthAppCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppCreateData, ResponseError, OAuthAppCreateVariables>(
    (vars) => createOAuthApp(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables
        await queryClient.invalidateQueries(oauthAppKeys.oauthApps(slug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create OAuth application: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
