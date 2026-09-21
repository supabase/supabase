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
      await queryClient.invalidateQueries({
        queryKey: oauthAppsKeys.authorizedApps(variables.slug),
      })
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
