import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
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
  UseMutationOptions<SecretsCreateData, ResponseError, SecretsCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SecretsCreateData, ResponseError, SecretsCreateVariables>(
    (vars) => createSecrets(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(secretsKeys.list(projectRef))
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
