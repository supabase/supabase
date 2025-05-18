import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { oauthAppKeys } from './keys'

export type AuthorizedAppRevokeVariables = {
  id: string
  slug: string
}

export async function revokeAuthorizedApp({ id, slug }: AuthorizedAppRevokeVariables) {
  if (!id) throw new Error('App ID is required')
  if (!slug) throw new Error('Organization slug is required')

  const { data, error } = await post('/platform/organizations/{slug}/oauth/apps/{id}/revoke', {
    params: { path: { slug, id } },
  })

  if (error) handleError(error)
  return data
}

type AuthorizedAppRevokeData = Awaited<ReturnType<typeof revokeAuthorizedApp>>

export const useAuthorizedAppRevokeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthorizedAppRevokeData, ResponseError, AuthorizedAppRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthorizedAppRevokeData, ResponseError, AuthorizedAppRevokeVariables>(
    (vars) => revokeAuthorizedApp(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables
        await queryClient.invalidateQueries(oauthAppKeys.authorizedApps(slug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to revoke application: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
