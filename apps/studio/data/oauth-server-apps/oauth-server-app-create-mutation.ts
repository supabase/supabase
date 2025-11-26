import { CreateOAuthClientParams, SupabaseClient } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppCreateVariables = CreateOAuthClientParams & {
  projectRef?: string
  supabaseClient?: SupabaseClient<any>
}

export async function createOAuthServerApp({
  projectRef,
  supabaseClient,
  ...params
}: OAuthServerAppCreateVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!supabaseClient) throw new Error('Supabase client is required')

  const { data, error } = await supabaseClient.auth.admin.oauth.createClient(params)

  if (error) return handleError(error)
  return data
}

type OAuthAppCreateData = Awaited<ReturnType<typeof createOAuthServerApp>>

export const useOAuthServerAppCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<OAuthAppCreateData, ResponseError, OAuthServerAppCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppCreateData, ResponseError, OAuthServerAppCreateVariables>({
    mutationFn: (vars) => createOAuthServerApp(vars),
    onSuccess: async (data, variables, context) => {
      const { projectRef } = variables
      await queryClient.invalidateQueries({
        queryKey: oauthServerAppKeys.list(projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    onError: async (data, variables, context) => {
      if (onError === undefined) {
        toast.error(`Failed to create OAuth Server application: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
