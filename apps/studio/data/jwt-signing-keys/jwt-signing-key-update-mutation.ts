import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { jwtSigningKeysKeys } from './keys'

interface JWTSigningKeyUpdateVariables {
  projectRef?: string
  keyId: string
  status: 'in_use' | 'standby' | 'previously_used' | 'revoked'
}

export async function updateJWTSigningKey(payload: JWTSigningKeyUpdateVariables) {
  if (!payload.projectRef) throw new Error('projectRef is required')

  const { data, error } = await patch('/v1/projects/{ref}/config/auth/signing-keys/{id}', {
    params: {
      path: { ref: payload.projectRef, id: payload.keyId },
    },
    body: {
      status: payload.status,
    },
  })

  if (error) handleError(error)
  return data
}

type JWTSigningKeyUpdateData = Awaited<ReturnType<typeof updateJWTSigningKey>>

export const useJWTSigningKeyUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JWTSigningKeyUpdateData, ResponseError, JWTSigningKeyUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JWTSigningKeyUpdateData, ResponseError, JWTSigningKeyUpdateVariables>(
    (vars) => updateJWTSigningKey(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(jwtSigningKeysKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update new JWT signing key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
