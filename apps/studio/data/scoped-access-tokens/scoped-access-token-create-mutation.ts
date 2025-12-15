import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { scopedAccessTokenKeys } from './keys'

export type ScopedAccessTokenCreateVariables = components['schemas']['CreateScopedAccessTokenBody']

export async function createScopedAccessToken({
  name,
  expires_at,
  organization_slugs,
  permissions,
  project_refs,
}: ScopedAccessTokenCreateVariables) {
  const { data, error } = await post('/platform/profile/scoped-access-tokens', {
    body: { name, organization_slugs, expires_at, permissions, project_refs },
  })

  if (error) handleError(error)

  return data
}

export type NewScopedAccessToken = components['schemas']['CreateScopedAccessTokenResponse']

export const useAccessTokenCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<NewScopedAccessToken, ResponseError, ScopedAccessTokenCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<NewScopedAccessToken, ResponseError, ScopedAccessTokenCreateVariables>({
    mutationFn: (vars) => createScopedAccessToken(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: scopedAccessTokenKeys.list() })

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
