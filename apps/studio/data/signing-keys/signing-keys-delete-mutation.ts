import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { signingKeysKeys } from './keys'

export type SigningKeyDeleteVariables = {
  projectRef?: string
  keyId: string
}

export async function deleteSigningKey({ projectRef, keyId }: SigningKeyDeleteVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await del(`/v1/projects/{ref}/config/auth/signing-keys/{id}`, {
    params: { path: { ref: projectRef, id: keyId } },
  })

  if (error) handleError(error)
  return data
}

export type SigningKeyDeleteData = Awaited<ReturnType<typeof deleteSigningKey>>

export const useSigningKeyDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SigningKeyDeleteData, ResponseError, SigningKeyDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SigningKeyDeleteData, ResponseError, SigningKeyDeleteVariables>(
    (vars) => deleteSigningKey(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete signing key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
