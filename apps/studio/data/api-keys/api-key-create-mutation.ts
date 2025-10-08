import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { apiKeysKeys } from './keys'

export type APIKeyCreateVariables = {
  projectRef?: string
  name: string
  description?: string
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
        : name),

      type: payload.type,
      name: payload.name,
      description: payload.description || null,
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

        await queryClient.invalidateQueries(apiKeysKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
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
