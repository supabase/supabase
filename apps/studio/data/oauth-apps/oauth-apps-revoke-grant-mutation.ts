import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from '../fetchers'
import { oauthAppsKeys } from './keys'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type OAuthGrantRevokeVariables = {
  grantId?: string
}

export async function revokeOAuthGrant({ grantId }: OAuthGrantRevokeVariables) {
  if (!grantId) throw new Error('Grant id is required')
  const { error } = await del('/platform/profile/oauth/grants/{grant_id}', {
    params: { path: { grant_id: grantId } },
  })
  if (error) handleError(error)
}

export type OAuthGrantRevokeData = Awaited<ReturnType<typeof revokeOAuthGrant>>

export const useOAuthGrantRevokeMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<OAuthGrantRevokeData, StudioError, OAuthGrantRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthGrantRevokeData, StudioError, OAuthGrantRevokeVariables>({
    mutationFn: (vars) => revokeOAuthGrant(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: oauthAppsKeys.grants() })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to revoke OAuth grant: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
