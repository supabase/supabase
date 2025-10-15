import { CreateOAuthClientParams } from '@supabase/auth-js'
import { SupabaseClient } from '@supabase/supabase-js'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
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

  if (error) handleError(error)
  return data
}

type OAuthAppCreateData = Awaited<ReturnType<typeof createOAuthServerApp>>

export const useOAuthServerAppCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OAuthAppCreateData, ResponseError, OAuthServerAppCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppCreateData, ResponseError, OAuthServerAppCreateVariables>(
    (vars) => createOAuthServerApp(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(oauthServerAppKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create OAuth Server application: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
