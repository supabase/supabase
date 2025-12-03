import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { secretsKeys } from './keys'

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
  UseCustomMutationOptions<SecretsCreateData, ResponseError, SecretsCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SecretsCreateData, ResponseError, SecretsCreateVariables>({
    mutationFn: (vars) => createSecrets(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: secretsKeys.list(projectRef) })
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
  })
}
