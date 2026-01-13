import { UpdateOAuthClientParams } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import { createProjectSupabaseClient } from 'lib/project-supabase-client'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppUpdateVariables = UpdateOAuthClientParams & {
  clientId: string | undefined
  projectRef: string | undefined
  clientEndpoint: string | undefined
}

export async function updateOAuthServerApp({
  clientId,
  projectRef,
  clientEndpoint,
  ...params
}: OAuthServerAppUpdateVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')
  if (!clientId) throw new Error('Client ID is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
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
      const { projectRef, clientEndpoint } = variables
      await queryClient.invalidateQueries({
        queryKey: oauthServerAppKeys.list(projectRef, clientEndpoint),
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
