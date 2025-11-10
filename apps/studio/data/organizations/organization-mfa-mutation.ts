import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMfaToggleVariables = {
  slug: string
  setEnforced: boolean
}

export async function toggleOrganizationMfa({ slug, setEnforced }: OrganizationMfaToggleVariables) {
  if (!slug) {
    throw new Error('Slug is required')
  }
  const { data, error } = await patch('/platform/organizations/{slug}/members/mfa/enforcement', {
    params: { path: { slug } },
    body: { enforced: setEnforced },
  })
  if (error) handleError(error)
  return data
}

type OrganizationMfaToggleData = Awaited<ReturnType<typeof toggleOrganizationMfa>>

export const useOrganizationMfaToggleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OrganizationMfaToggleData,
    ResponseError,
    OrganizationMfaToggleVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationMfaToggleData, ResponseError, OrganizationMfaToggleVariables>({
    mutationFn: (vars) => toggleOrganizationMfa(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables

      // We already have the data, no need to refetch
      queryClient.setQueryData(organizationKeys.mfa(slug), data.enforced)
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update MFA enforcement: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
