import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { secretsKeys } from 'data/secrets/keys'
import type { ResponseError } from 'types'
import { apiKeysKeys } from './keys'

export type APIKeyCreateVariables = {
  projectRef?: string
  name: string
  description?: string
  expose_as_env?: boolean
} & (
  | {
      type: 'publishable'
    }
  | {
      type: 'secret'
      // secret_jwt_template?: { // @mildtomato (Jonny) removed this field to reduce scope
      //   role: string
      // } | null
    }
)

export async function createAPIKey(payload: APIKeyCreateVariables) {
  if (!payload.projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/v1/projects/{ref}/api-keys', {
    params: {
      path: { ref: payload.projectRef },
      query: {
        reveal: false,
      },
    },
    body: {
      ...(payload.type === 'secret'
        ? {
            // secret_jwt_template: payload?.secret_jwt_template || null,
            secret_jwt_template: {
              role: 'service_role',
            },
          }
        : null),

      type: payload.type,
      name: payload.name,
      description: payload.description || null,
      expose_as_env: payload.expose_as_env,
    },
  })

  if (error) handleError(error)
  return data
}

type APIKeyCreateData = Awaited<ReturnType<typeof createAPIKey>>

export const useAPIKeyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<APIKeyCreateData, ResponseError, APIKeyCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<APIKeyCreateData, ResponseError, APIKeyCreateVariables>(
    (vars) => createAPIKey(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([
          queryClient.invalidateQueries(apiKeysKeys.list(projectRef)),
          queryClient.invalidateQueries(secretsKeys.list(projectRef)),
        ])
        await await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create API key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
