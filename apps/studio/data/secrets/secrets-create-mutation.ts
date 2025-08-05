import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post, get } from 'data/fetchers'
import type { ResponseError } from 'types'
import { secretsKeys } from './keys'
import { edgeFunctionsKeys } from '../edge-functions/keys'

export type SecretsCreateVariables = {
  projectRef?: string
  secrets: { name: string; value: string }[]
}

export async function createSecrets({ projectRef, secrets }: SecretsCreateVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await post('/v1/projects/{ref}/secrets', {
    params: { path: { ref: projectRef } },
    body: secrets,
  })

  if (error) handleError(error)
  return data
}

type SecretsCreateData = Awaited<ReturnType<typeof createSecrets>>

export const useSecretsCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SecretsCreateData, ResponseError, SecretsCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  
  return useMutation<SecretsCreateData, ResponseError, SecretsCreateVariables>(
    (vars) => createSecrets(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        
        // Invalidate secrets cache
        await queryClient.invalidateQueries(secretsKeys.list(projectRef))
        
        // Trigger Edge Functions cache invalidation to ensure they pick up new environment variables
        // This will force Edge Functions to reload with updated secrets
        await queryClient.invalidateQueries(edgeFunctionsKeys.list(projectRef))
        
        // Show success message indicating that Edge Functions will be updated
        toast.success('Secrets updated successfully. Edge Functions will be redeployed automatically.')
        
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create secrets: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
