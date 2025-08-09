import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { jwtSigningKeysKeys } from './keys'

interface LegacyJWTSigningKeyCreateVariables {
  projectRef?: string
}

export async function createLegacyJWTSigningKey(payload: LegacyJWTSigningKeyCreateVariables) {
  if (!payload.projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/v1/projects/{ref}/config/auth/signing-keys/legacy', {
    params: {
      path: { ref: payload.projectRef },
    },
  })

  if (error) handleError(error)
  return data
}

type LegacyJWTSigningKeyCreateData = Awaited<ReturnType<typeof createLegacyJWTSigningKey>>

export const useLegacyJWTSigningKeyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    LegacyJWTSigningKeyCreateData,
    ResponseError,
    LegacyJWTSigningKeyCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    LegacyJWTSigningKeyCreateData,
    ResponseError,
    LegacyJWTSigningKeyCreateVariables
  >((vars) => createLegacyJWTSigningKey(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await queryClient.invalidateQueries(jwtSigningKeysKeys.legacy(projectRef))
      // invalidate the keys as well since migration creates 2 new keys and the UI needs to be refreshed
      await queryClient.invalidateQueries(jwtSigningKeysKeys.list(projectRef))

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to enable use of JWT signing keys with legacy JWT secret: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
