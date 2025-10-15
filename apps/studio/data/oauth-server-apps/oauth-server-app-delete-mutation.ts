import { SupabaseClient } from '@supabase/supabase-js'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppDeleteVariables = {
  clientId?: string
  projectRef?: string
  supabaseClient?: SupabaseClient<any>
}

export async function deleteOAuthServerApp({
  projectRef,
  supabaseClient,
  clientId,
}: OAuthServerAppDeleteVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!supabaseClient) throw new Error('Supabase client is required')
  if (!clientId) throw new Error('Client ID is required')

  const { data, error } = await supabaseClient.auth.admin.oauth.deleteClient(clientId)

  if (error) handleError(error)
  return data
}

type OAuthAppDeleteData = Awaited<ReturnType<typeof deleteOAuthServerApp>>

export const useOAuthServerAppDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OAuthAppDeleteData, ResponseError, OAuthServerAppDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppDeleteData, ResponseError, OAuthServerAppDeleteVariables>(
    (vars) => deleteOAuthServerApp(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(oauthServerAppKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete OAuth Server application: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
