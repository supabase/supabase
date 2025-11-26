import { UpdateOAuthClientParams, SupabaseClient } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppUpdateVariables = UpdateOAuthClientParams & {
  clientId: string
  projectRef?: string
  supabaseClient?: SupabaseClient<any>
}

export async function updateOAuthServerApp({
  clientId,
  projectRef,
  supabaseClient,
  ...params
}: OAuthServerAppUpdateVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!supabaseClient) throw new Error('Supabase client is required')

  const { data, error } = await supabaseClient.auth.admin.oauth.updateClient(clientId, params)

  if (error) return handleError(error)
  return data
}

type OAuthAppUpdateData = Awaited<ReturnType<typeof updateOAuthServerApp>>

export const useOAuthServerAppUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<OAuthAppUpdateData, ResponseError, OAuthServerAppUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppUpdateData, ResponseError, OAuthServerAppUpdateVariables>({
    mutationFn: (vars) => updateOAuthServerApp(vars),
    onSuccess: async (data, variables, context) => {
      const { projectRef } = variables
      await queryClient.invalidateQueries({
        queryKey: oauthServerAppKeys.list(projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    onError: async (data, variables, context) => {
      if (onError === undefined) {
        toast.error(`Failed to update OAuth Server application: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
