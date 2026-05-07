import { CreateOAuthClientParams } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import { createProjectSupabaseClient } from 'lib/project-supabase-client'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppCreateVariables = CreateOAuthClientParams & {
  projectRef: string | undefined
  clientEndpoint: string | undefined
}

export async function createOAuthServerApp({
  projectRef,
  clientEndpoint,
  ...params
}: OAuthServerAppCreateVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
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
      const { projectRef, clientEndpoint } = variables
      await queryClient.invalidateQueries({
        queryKey: oauthServerAppKeys.list(projectRef, clientEndpoint),
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
