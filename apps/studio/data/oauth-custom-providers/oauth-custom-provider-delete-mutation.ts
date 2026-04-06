import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { oAuthCustomProvidersKeys } from './keys'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { handleError } from '@/data/fetchers'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthCustomProviderDeleteVariables = {
  identifier: string | undefined
  projectRef: string | undefined
  clientEndpoint: string | undefined
}

export async function deleteOAuthCustomProvider({
  projectRef,
  clientEndpoint,
  identifier,
}: OAuthCustomProviderDeleteVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')
  if (!identifier) throw new Error('Provider identifier is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
  const { error } = await supabaseClient.auth.admin.customProviders.deleteProvider(identifier)

  if (error) handleError(error)
  return null
}

type OAuthCustomProviderDeleteData = Awaited<ReturnType<typeof deleteOAuthCustomProvider>>

export const useOAuthCustomProviderDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthCustomProviderDeleteData,
    ResponseError,
    OAuthCustomProviderDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OAuthCustomProviderDeleteData,
    ResponseError,
    OAuthCustomProviderDeleteVariables
  >({
    mutationFn: (vars) => deleteOAuthCustomProvider(vars),
    onSuccess: async (data, variables, context) => {
      const { projectRef, clientEndpoint } = variables
      await queryClient.invalidateQueries({
        queryKey: oAuthCustomProvidersKeys.list(projectRef, clientEndpoint),
      })
      await onSuccess?.(data, variables, context)
    },
    onError: async (data, variables, context) => {
      if (onError === undefined) {
        toast.error(`Failed to delete custom OAuth provider: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
