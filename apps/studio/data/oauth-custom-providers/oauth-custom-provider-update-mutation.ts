import type { UpdateCustomProviderParams } from '@supabase/auth-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { customProviderAdminRequest } from './custom-provider-admin-request'
import { oAuthCustomProvidersKeys } from './keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OAuthCustomProviderUpdateVariables = UpdateCustomProviderParams & {
  identifier: string | undefined
  projectRef: string | undefined
  clientEndpoint: string | undefined
}

export async function updateOAuthCustomProvider({
  identifier,
  projectRef,
  clientEndpoint,
  ...params
}: OAuthCustomProviderUpdateVariables) {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')
  if (!identifier) throw new Error('Provider identifier is required')

  return customProviderAdminRequest({
    method: 'PUT',
    projectRef,
    clientEndpoint,
    identifier,
    body: params,
  })
}

type OAuthCustomProviderUpdateData = Awaited<ReturnType<typeof updateOAuthCustomProvider>>

export const useOAuthCustomProviderUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OAuthCustomProviderUpdateData,
    ResponseError,
    OAuthCustomProviderUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OAuthCustomProviderUpdateData,
    ResponseError,
    OAuthCustomProviderUpdateVariables
  >({
    mutationFn: (vars) => updateOAuthCustomProvider(vars),
    onSuccess: async (data, variables, context) => {
      const { projectRef, clientEndpoint } = variables
      await queryClient.invalidateQueries({
        queryKey: oAuthCustomProvidersKeys.list(projectRef, clientEndpoint),
      })
      await onSuccess?.(data, variables, context)
    },
    onError: async (data, variables, context) => {
      if (onError === undefined) {
        toast.error(`Failed to update custom OAuth provider: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
