import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMemberInviteCreateVariables = {
  slug: string
  invitedEmail: string
  ownerId: number
  roleId: number
}

// [Joshen TODO] Should be deprecated now - double check before deleting

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
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberInviteCreateData,
    ResponseError,
    OrganizationMemberInviteCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberInviteCreateData,
    ResponseError,
    OrganizationMemberInviteCreateVariables
  >((vars) => createOrganizationMemberInvite(vars), {
    async onSuccess(data, variables, context) {
      const { slug } = variables

      await Promise.all([
        queryClient.invalidateQueries(organizationKeys.members(slug)),
        queryClient.invalidateQueries(organizationKeys.roles(slug)),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to invite member: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
