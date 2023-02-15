import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
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
  ...options
}: Omit<
  UseMutationOptions<JwtSecretUpdateData, unknown, JwtSecretUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JwtSecretUpdateData, unknown, JwtSecretUpdateVariables>(
    (vars) => updateJwtSecret(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(configKeys.jwtSecretUpdatingStatus(projectRef))

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
