import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'
import { configKeys } from './keys'

export type JwtSecretUpdateVariables = {
  projectRef: string
  jwtSecret?: string
  jwtOidcIssuers?: string[]
  jwtJwksUris?: string[]
  jwtCustomJwks?: string
  changeTrackingId: string
}

export async function updateJwtSecret({
  projectRef,
  jwtSecret,
  jwtOidcIssuers,
  jwtJwksUris,
  jwtCustomJwks,
  changeTrackingId,
}: JwtSecretUpdateVariables) {
  const { data, error } = await patch('/platform/projects/{ref}/config/secrets', {
    params: {
      path: {
        ref: projectRef,
      },
    },
    body: {
      jwt_secret: jwtSecret,
      jwt_oidc_issuers: jwtOidcIssuers,
      jwt_jwks_uris: jwtJwksUris,
      jwt_custom_jwks: jwtCustomJwks,
      change_tracking_id: changeTrackingId,
    },
  })

  if (error) throw error
  return data
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
