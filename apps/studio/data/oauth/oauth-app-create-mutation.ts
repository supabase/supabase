import type { OAuthScope } from '@supabase/shared-types/out/constants'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { oauthAppKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type OAuthAppCreateVariables = {
  slug: string
  name: string
  website: string
  icon?: string
  scopes: OAuthScope[]
  redirect_uris: string[]
  grant_kind?: 'organization_bound' | 'member_bound'
  project_scoping_mode?: boolean
  allow_partial_grants?: boolean
}

export type OAuthAppCreateResponse = components['schemas']['CreateOAuthAppResponse_Output']

export async function createOAuthApp({
  slug,
  name,
  website,
  icon,
  scopes,
  redirect_uris,
  grant_kind,
  project_scoping_mode,
  allow_partial_grants,
}: OAuthAppCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/oauth/apps', {
    params: { path: { slug } },
    body: {
      name,
      website,
      icon,
      scopes,
      redirect_uris,
      grant_kind,
      project_scoping_mode,
      allow_partial_grants,
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
  UseCustomMutationOptions<OAuthAppCreateData, StudioError, OAuthAppCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppCreateData, StudioError, OAuthAppCreateVariables>({
    mutationFn: (vars) => createOAuthApp(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables
      await queryClient.invalidateQueries({ queryKey: oauthAppKeys.oauthApps(slug) })
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
  })
}
