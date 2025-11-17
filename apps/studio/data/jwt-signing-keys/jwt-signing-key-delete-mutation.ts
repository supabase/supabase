import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { jwtSigningKeysKeys } from './keys'

interface JWTSigningKeyDeleteVariables {
  projectRef?: string
  keyId: string
}

export async function deleteJWTSigningKey(payload: JWTSigningKeyDeleteVariables) {
  if (!payload.projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/v1/projects/{ref}/config/auth/signing-keys/{id}', {
    params: {
      path: { ref: payload.projectRef, id: payload.keyId },
    },
  })

  if (error) handleError(error)
  return data
}

type JWTSigningKeyDeleteData = Awaited<ReturnType<typeof deleteJWTSigningKey>>

export const useJWTSigningKeyDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<JWTSigningKeyDeleteData, ResponseError, JWTSigningKeyDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JWTSigningKeyDeleteData, ResponseError, JWTSigningKeyDeleteVariables>({
    mutationFn: (vars) => deleteJWTSigningKey(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await queryClient.invalidateQueries({ queryKey: jwtSigningKeysKeys.list(projectRef) })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete JWT signing key: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
