import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { JWTAlgorithm } from './jwt-signing-keys-query'
import { jwtSigningKeysKeys } from './keys'

interface JWTSigningKeyCreateVariables {
  projectRef?: string
  algorithm: JWTAlgorithm
  status: 'in_use' | 'standby'
  private_jwk: any
}

export async function createJWTSigningKey(payload: JWTSigningKeyCreateVariables) {
  if (!payload.projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/v1/projects/{ref}/config/auth/signing-keys', {
    params: {
      path: { ref: payload.projectRef },
    },
    body: {
      algorithm: payload.algorithm,
      status: payload.status,
      ...(payload.private_jwk ? { private_jwk: payload.private_jwk } : null),
    },
  })

  if (error) handleError(error)
  return data
}

type JWTSigningKeyCreateData = Awaited<ReturnType<typeof createJWTSigningKey>>

export const useJWTSigningKeyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JWTSigningKeyCreateData, ResponseError, JWTSigningKeyCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JWTSigningKeyCreateData, ResponseError, JWTSigningKeyCreateVariables>(
    (vars) => createJWTSigningKey(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(jwtSigningKeysKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create new JWT signing key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
