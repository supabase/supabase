import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { components } from 'data/api'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthConfigUpdateVariables = {
  projectRef: string
  config: Partial<components['schemas']['UpdateGoTrueConfigBody']>
}

export type UpdateAuthConfigResponse = components['schemas']['GoTrueConfig']

export async function updateAuthConfig({ projectRef, config }: AuthConfigUpdateVariables) {
  const response = await patch(`${API_URL}/auth/${projectRef}/config`, { ...config })
  if (response.error) {
    throw response.error
  }

  return response as UpdateAuthConfigResponse
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

        await Promise.all([queryClient.invalidateQueries(authKeys.authConfig(projectRef))])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to mutate: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
