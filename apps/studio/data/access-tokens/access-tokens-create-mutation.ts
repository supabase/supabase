import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { accessTokenKeys } from './keys'

export type AccessTokenCreateVariables = components['schemas']['CreateAccessTokenBody']

export async function createAccessToken({ name, scope, expires_at }: AccessTokenCreateVariables) {
  const { data, error } = await post('/platform/profile/access-tokens', {
    body: { name, scope, expires_at },
  })

  if (error) handleError(error)

  return data
}

type AccessTokenCreateData = Awaited<ReturnType<typeof createAccessToken>>

export type NewAccessToken = AccessTokenCreateData

export const useAccessTokenCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AccessTokenCreateData, ResponseError, AccessTokenCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AccessTokenCreateData, ResponseError, AccessTokenCreateVariables>({
    mutationFn: (vars) => createAccessToken(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: accessTokenKeys.list() })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create access token: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
