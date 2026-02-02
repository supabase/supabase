import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import { createProjectSupabaseClient } from 'lib/project-supabase-client'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppRegenerateSecretVariables = {
  projectRef: string | undefined
  clientId: string | undefined
  clientEndpoint: string | undefined
}

export async function regenerateSecret({
  projectRef,
  clientEndpoint,
  clientId,
}: OAuthServerAppRegenerateSecretVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')
  if (!clientId) throw new Error('Oauth app client id is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
  const { data, error } = await supabaseClient.auth.admin.oauth.regenerateClientSecret(clientId)

  if (error) handleError(error)
  return data
}

type OAuthAppRegenerateSecretData = Awaited<ReturnType<typeof regenerateSecret>>

export const useOAuthServerAppRegenerateSecretMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthAppRegenerateSecretData,
    ResponseError,
    OAuthServerAppRegenerateSecretVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OAuthAppRegenerateSecretData,
    ResponseError,
    OAuthServerAppRegenerateSecretVariables
  >({
    mutationFn: (vars) => regenerateSecret(vars),
    onSuccess: async (data, variables, context) => {
      const { projectRef, clientEndpoint } = variables
      await queryClient.invalidateQueries({
        queryKey: oauthServerAppKeys.list(projectRef, clientEndpoint),
      })
      await onSuccess?.(data, variables, context)
    },
    onError: async (data, variables, context) => {
      if (onError === undefined) {
        toast.error(`Failed to regenerate OAuth application secret: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
