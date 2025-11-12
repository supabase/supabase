import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMemberDeleteVariables = {
  slug: string
  gotrueId: string
}

export async function deleteOrganizationMember({
  slug,
  gotrueId,
}: OrganizationMemberDeleteVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/members/{gotrue_id}', {
    params: { path: { slug, gotrue_id: gotrueId } },
  })
  if (error) handleError(error)
  return data
}

type OrganizationMemberDeleteData = Awaited<ReturnType<typeof deleteOrganizationMember>>

export const useOrganizationMemberDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OrganizationMemberDeleteData,
    ResponseError,
    OrganizationMemberDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberDeleteData,
    ResponseError,
    OrganizationMemberDeleteVariables
  >({
    mutationFn: (vars) => deleteOrganizationMember(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.members(slug) }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.roles(slug) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to remove member: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
