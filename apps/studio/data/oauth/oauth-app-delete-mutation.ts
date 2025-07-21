import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { oauthAppKeys } from './keys'

export type OAuthAppDeleteVariables = {
  id: string
  slug: string
}

export async function deleteOAuthApp({ id, slug }: OAuthAppDeleteVariables) {
  if (!id) throw new Error('OAuth app ID is required')
  if (!slug) throw new Error('Organization slug is required')

  const { data, error } = await del('/platform/organizations/{slug}/oauth/apps/{id}', {
    params: { path: { slug, id } },
  })

  if (error) handleError(error)
  return data
}

type OAuthAppDeleteData = Awaited<ReturnType<typeof deleteOAuthApp>>

export const useOAuthAppDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OAuthAppDeleteData, ResponseError, OAuthAppDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppDeleteData, ResponseError, OAuthAppDeleteVariables>(
    (vars) => deleteOAuthApp(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables
        await queryClient.invalidateQueries(oauthAppKeys.oauthApps(slug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete application: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
