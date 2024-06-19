import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthConfigUpdateVariables = {
  projectRef: string
  config: Partial<components['schemas']['UpdateGoTrueConfigBody']>
}

export async function updateAuthConfig({ projectRef, config }: AuthConfigUpdateVariables) {
  const { data, error } = await patch('/platform/auth/{ref}/config', {
    params: {
      path: { ref: projectRef },
    },
    body: {
      ...config,
    },
  })

  if (error) handleError(error)
  return data
}

type AuthConfigUpdateData = Awaited<ReturnType<typeof updateAuthConfig>>

export const useAuthConfigUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthConfigUpdateData, ResponseError, AuthConfigUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthConfigUpdateData, ResponseError, AuthConfigUpdateVariables>(
    (vars) => updateAuthConfig(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(authKeys.authConfig(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update auth configuration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
