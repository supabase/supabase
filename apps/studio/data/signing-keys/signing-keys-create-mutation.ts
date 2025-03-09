import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { post, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { signingKeysKeys } from './keys'
import type { components } from 'api-types'

export type SigningKeyCreateVariables = components['schemas']['CreateSigningKeyBody']

export async function createSigningKey({
  projectRef,
  algorithm,
  status,
}: SigningKeyCreateVariables & { projectRef?: string }) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await post(`/v1/projects/{ref}/config/auth/signing-keys`, {
    params: { path: { ref: projectRef } },
    body: { algorithm, status },
  })

  if (error) handleError(error)
  return data
}

export type SigningKeyCreateData = Awaited<ReturnType<typeof createSigningKey>>

export const useSigningKeyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    SigningKeyCreateData,
    ResponseError,
    SigningKeyCreateVariables & { projectRef: string }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    SigningKeyCreateData,
    ResponseError,
    SigningKeyCreateVariables & { projectRef: string }
  >((vars) => createSigningKey(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create signing key: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
