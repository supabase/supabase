import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { oauthAppsKeys } from './keys'
import { USE_MOCKS } from './mocks'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthAppRevokeVariables = {
  slug: string
  appId: string
}

export async function revokeOAuthApp({ slug, appId }: OAuthAppRevokeVariables) {
  if (!slug) throw new Error('Organization slug is required')
  if (!appId) throw new Error('App id is required')
  if (!USE_MOCKS) throw new Error('OAuth app revocation is not yet implemented')

  return { id: appId }
}

type OAuthAppRevokeData = Awaited<ReturnType<typeof revokeOAuthApp>>

export const useOAuthAppRevokeMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<OAuthAppRevokeData, ResponseError, OAuthAppRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppRevokeData, ResponseError, OAuthAppRevokeVariables>({
    mutationFn: (vars) => revokeOAuthApp(vars),
    async onSuccess(data, variables, context) {
      // Revoking an app deletes every row for (app_id, organization_id), both kinds — the
      // org's approvals overview, this app's grant list, and any member's own-grants view are
      // all stale.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: oauthAppsKeys.approvals(variables.slug) }),
        queryClient.invalidateQueries({
          queryKey: oauthAppsKeys.appMemberGrants(variables.slug, variables.appId),
        }),
        queryClient.invalidateQueries({ queryKey: oauthAppsKeys.grants() }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to revoke OAuth app: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
