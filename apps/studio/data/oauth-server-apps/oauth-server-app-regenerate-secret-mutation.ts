import { SupabaseClient } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppRegenerateSecretVariables = {
  projectRef?: string
  supabaseClient?: SupabaseClient<any>
  clientId: string
}

export async function regenerateSecret({
  projectRef,
  supabaseClient,
  clientId,
}: OAuthServerAppRegenerateSecretVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!supabaseClient) throw new Error('Supabase client is required')
  if (!clientId) throw new Error('Oauth app client id is required')

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
      const { projectRef } = variables
      await queryClient.invalidateQueries({
        queryKey: oauthServerAppKeys.list(projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    onError: async (data, variables, context) => {
      if (onError === undefined) {
        toast.error(`Failed to regenerate OAuth Server application secret: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
