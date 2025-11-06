import { useMutation, useQueryClient } from '@tanstack/react-query'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { configKeys } from './keys'

export type JwtSecretUpdateVariables = {
  projectRef: string
  jwtSecret: string
  changeTrackingId: string
}

export async function updateJwtSecret({
  projectRef,
  jwtSecret,
  changeTrackingId,
}: JwtSecretUpdateVariables) {
  const { data, error } = await patch('/platform/projects/{ref}/config/secrets', {
    params: {
      path: { ref: projectRef },
    },
    body: {
      jwt_secret: jwtSecret,
      change_tracking_id: changeTrackingId,
    },
  })

  if (error) handleError(error)

  return data
}

type JwtSecretUpdateData = Awaited<ReturnType<typeof updateJwtSecret>>

export const useJwtSecretUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<JwtSecretUpdateData, ResponseError, JwtSecretUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JwtSecretUpdateData, ResponseError, JwtSecretUpdateVariables>({
    mutationFn: (vars) => updateJwtSecret(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({
        queryKey: configKeys.jwtSecretUpdatingStatus(projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      await onError?.(data, variables, context)
    },
    ...options,
  })
}
