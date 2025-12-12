import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from 'data/fetchers'
import { createProjectSupabaseClient } from 'lib/project-supabase-client'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { oauthServerAppKeys } from './keys'

export type OAuthServerAppDeleteVariables = {
  clientId: string | undefined
  projectRef: string | undefined
  clientEndpoint: string | undefined
}

export async function deleteOAuthServerApp({
  projectRef,
  clientEndpoint,
  clientId,
}: OAuthServerAppDeleteVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')
  if (!clientId) throw new Error('Client ID is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
  const { data, error } = await supabaseClient.auth.admin.oauth.deleteClient(clientId)

  if (error) return handleError(error)
  return null
}

type OAuthAppDeleteData = Awaited<ReturnType<typeof deleteOAuthServerApp>>

export const useOAuthServerAppDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<OAuthAppDeleteData, ResponseError, OAuthServerAppDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OAuthAppDeleteData, ResponseError, OAuthServerAppDeleteVariables>({
    mutationFn: (vars) => deleteOAuthServerApp(vars),
    onSuccess: async (data, variables, context) => {
      const { projectRef, clientEndpoint } = variables
      await queryClient.invalidateQueries({
        queryKey: oauthServerAppKeys.list(projectRef, clientEndpoint),
      })
      await onSuccess?.(data, variables, context)
    },
    onError: async (data, variables, context) => {
      if (onError === undefined) {
        toast.error(`Failed to delete OAuth Server application: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
