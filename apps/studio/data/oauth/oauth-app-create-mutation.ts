import type { OAuthScope } from '@supabase/shared-types/out/constants'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
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

export type OAuthAppCreateResponse = components['schemas']['CreateOAuthAppResponse']

export async function createOAuthApp({
  slug,
  name,
  website,
  icon,
  scopes,
  redirect_uris,
}: OAuthAppCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/oauth/apps', {
    params: { path: { slug } },
    body: {
      name,
      website,
      icon,
      scopes,
      redirect_uris,
    },
  })

  if (error) handleError(error)
  return data
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
