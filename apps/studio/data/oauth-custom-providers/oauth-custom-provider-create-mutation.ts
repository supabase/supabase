import type { CreateCustomProviderParams } from '@supabase/auth-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { oAuthCustomProvidersKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthCustomProviderCreateVariables = CreateCustomProviderParams & {
  projectRef: string | undefined
  clientEndpoint: string | undefined
}

export async function createOAuthCustomProvider({
  projectRef,
  clientEndpoint,
  ...params
}: OAuthCustomProviderCreateVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
  const { data, error } = await supabaseClient.auth.admin.customProviders.createProvider(params)

  if (error) handleError(error)
  return data!
}

type OAuthCustomProviderCreateData = Awaited<ReturnType<typeof createOAuthCustomProvider>>

export const useOAuthCustomProviderCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthCustomProviderCreateData,
    ResponseError,
    OAuthCustomProviderCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OAuthCustomProviderCreateData,
    ResponseError,
    OAuthCustomProviderCreateVariables
  >({
    mutationFn: (vars) => createOAuthCustomProvider(vars),
    onSuccess: async (data, variables, context) => {
      const { projectRef, clientEndpoint } = variables
      await queryClient.invalidateQueries({
        queryKey: oAuthCustomProvidersKeys.list(projectRef, clientEndpoint),
      })
      await onSuccess?.(data, variables, context)
    },
    onError: async (data, variables, context) => {
      if (onError === undefined) {
        toast.error(`Failed to create custom OAuth provider: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
