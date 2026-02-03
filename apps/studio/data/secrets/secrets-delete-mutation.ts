import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { secretsKeys } from './keys'

export type SecretsDeleteVariables = {
  projectRef?: string
  secrets: string[]
}

export async function deleteSecrets({ projectRef, secrets }: SecretsDeleteVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await del('/v1/projects/{ref}/secrets', {
    params: { path: { ref: projectRef } },
    body: secrets,
  })

  if (error) handleError(error)
  return data
}

type SecretsDeleteData = Awaited<ReturnType<typeof deleteSecrets>>

export const useSecretsDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SecretsDeleteData, ResponseError, SecretsDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SecretsDeleteData, ResponseError, SecretsDeleteVariables>({
    mutationFn: (vars) => deleteSecrets(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: secretsKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete secrets: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
