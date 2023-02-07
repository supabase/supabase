import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'

export type OrganizationMemberInviteDeleteVariables = {
  slug: string
  invitedId: number
}

export async function deleteOrganizationMemberInvite({
  slug,
  invitedId,
}: OrganizationMemberInviteDeleteVariables) {
  const response = await delete_(
    `${API_URL}/organizations/${slug}/members/invite?invited_id=${invitedId}`,
    {}
  )
  if (response.error) {
    throw response.error
  }

  return response
}

type OrganizationMemberInviteDeleteData = Awaited<ReturnType<typeof deleteOrganizationMemberInvite>>

export const useOrganizationMemberInviteDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberInviteDeleteData,
    unknown,
    OrganizationMemberInviteDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberInviteDeleteData,
    unknown,
    OrganizationMemberInviteDeleteVariables
  >((vars) => deleteOrganizationMemberInvite(vars), {
    async onSuccess(data, variables, context) {
      const { slug } = variables

      await Promise.all([
        queryClient.invalidateQueries(organizationKeys.detail(slug)),
        queryClient.invalidateQueries(organizationKeys.roles(slug)),
      ])

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
