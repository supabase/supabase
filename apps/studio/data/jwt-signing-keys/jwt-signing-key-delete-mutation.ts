import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { jwtSigningKeysKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'
import type { UseCustomMutationOptions } from '@/types'

export type JWTSigningKeyDeleteGrant = GrantFor<
  'delete',
  '/v1/projects/{ref}/config/auth/signing-keys/{id}'
>

interface JWTSigningKeyDeleteVariables {
  projectRef?: string
  grant: JWTSigningKeyDeleteGrant
  keyId: string
}

export async function deleteJWTSigningKey(payload: JWTSigningKeyDeleteVariables) {
  if (!payload.projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/v1/projects/{ref}/config/auth/signing-keys/{id}', {
    params: {
      path: { ref: payload.projectRef, id: payload.keyId },
    },
    grant: payload.grant,
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
  UseCustomMutationOptions<JWTSigningKeyDeleteData, StudioError, JWTSigningKeyDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JWTSigningKeyDeleteData, StudioError, JWTSigningKeyDeleteVariables>({
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
