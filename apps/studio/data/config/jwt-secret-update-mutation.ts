import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
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
  const response = await patch(`${API_URL}/projects/${projectRef}/config/secrets`, {
    jwt_secret: jwtSecret,
    change_tracking_id: changeTrackingId,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type JwtSecretUpdateData = Awaited<ReturnType<typeof updateJwtSecret>>

export const useJwtSecretUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JwtSecretUpdateData, ResponseError, JwtSecretUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JwtSecretUpdateData, ResponseError, JwtSecretUpdateVariables>(
    (vars) => updateJwtSecret(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(configKeys.jwtSecretUpdatingStatus(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to submit JWT secret update request: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
