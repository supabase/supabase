import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { jwtSigningKeysKeys } from './keys'
import { handleError, patch } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'
import type { UseCustomMutationOptions } from '@/types'

export type JWTSigningKeyUpdateGrant = GrantFor<
  'patch',
  '/v1/projects/{ref}/config/auth/signing-keys/{id}'
>

interface JWTSigningKeyUpdateVariables {
  projectRef?: string
  grant: JWTSigningKeyUpdateGrant
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
    grant: payload.grant,
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
  UseCustomMutationOptions<JWTSigningKeyUpdateData, StudioError, JWTSigningKeyUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JWTSigningKeyUpdateData, StudioError, JWTSigningKeyUpdateVariables>({
    mutationFn: (vars) => updateJWTSigningKey(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await queryClient.invalidateQueries({ queryKey: jwtSigningKeysKeys.list(projectRef) })

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
  })
}
