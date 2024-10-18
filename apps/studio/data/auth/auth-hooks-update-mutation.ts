import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthHooksUpdateVariables = {
  projectRef: string
  config: components['schemas']['UpdateGoTrueConfigHooksBody']
}

export async function updateAuthHooks({ projectRef, config }: AuthHooksUpdateVariables) {
  const { data, error } = await patch('/platform/auth/{ref}/config/hooks', {
    params: { path: { ref: projectRef } },
    body: config,
  })

  if (error) handleError(error)
  return data
}

type AuthHooksUpdateData = Awaited<ReturnType<typeof updateAuthHooks>>

export const useAuthHooksUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthHooksUpdateData, ResponseError, AuthHooksUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthHooksUpdateData, ResponseError, AuthHooksUpdateVariables>(
    (vars) => updateAuthHooks(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(authKeys.authConfig(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update auth hooks: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
