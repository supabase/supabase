import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'

export type OrganizationMemberInviteCreateVariables = {
  slug: string
  invitedEmail: string
  ownerId: number
  roleId: number
}

export async function createOrganizationMemberInvite({
  slug,
  invitedEmail,
  ownerId,
  roleId,
}: OrganizationMemberInviteCreateVariables) {
  const response = await post(`${API_URL}/organizations/${slug}/members/invite`, {
    invited_email: invitedEmail,
    owner_id: ownerId,
    role_id: roleId,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type OrganizationMemberInviteCreateData = Awaited<ReturnType<typeof createOrganizationMemberInvite>>

export const useOrganizationMemberInviteCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberInviteCreateData,
    unknown,
    OrganizationMemberInviteCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberInviteCreateData,
    unknown,
    OrganizationMemberInviteCreateVariables
  >((vars) => createOrganizationMemberInvite(vars), {
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
