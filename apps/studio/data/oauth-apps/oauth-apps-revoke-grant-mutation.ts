import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { oauthAppsKeys } from './keys'
import { USE_MOCKS } from './mocks'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthGrantRevokeVariables = {
  slug: string
  grantId: string
}

export async function revokeOAuthGrant({ slug, grantId }: OAuthGrantRevokeVariables) {
  if (!slug) throw new Error('Organization slug is required')
  if (!grantId) throw new Error('Grant id is required')
  if (!USE_MOCKS) throw new Error('OAuth grant revocation is not yet implemented')

  // 204 on success — no response body.
}

type OAuthGrantRevokeData = Awaited<ReturnType<typeof revokeOAuthGrant>>

export const useOAuthGrantRevokeMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<OAuthGrantRevokeData, ResponseError, OAuthGrantRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthGrantRevokeData, ResponseError, OAuthGrantRevokeVariables>({
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
