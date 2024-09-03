import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMemberInviteDeleteVariables = {
  slug: string
  invitedId: number
  invalidateDetail?: boolean
}

// [Joshen TODO] Should be deprecated now - double check before deleting

export async function deleteOrganizationMemberInvite({
  slug,
  invitedId,
}: OrganizationMemberInviteDeleteVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/members/invite', {
    params: { path: { slug }, query: { invited_id: invitedId } },
  })
  if (error) handleError(error)
  return data
}

type OrganizationMemberInviteDeleteData = Awaited<ReturnType<typeof deleteOrganizationMemberInvite>>

export const useOrganizationMemberInviteDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberInviteDeleteData,
    ResponseError,
    OrganizationMemberInviteDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberInviteDeleteData,
    ResponseError,
    OrganizationMemberInviteDeleteVariables
  >((vars) => deleteOrganizationMemberInvite(vars), {
    async onSuccess(data, variables, context) {
      const { slug, invalidateDetail } = variables

      await Promise.all([
        ...(invalidateDetail ?? true
          ? [queryClient.invalidateQueries(organizationKeys.members(slug))]
          : []),
        queryClient.invalidateQueries(organizationKeys.roles(slug)),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to revoke invitation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
