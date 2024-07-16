import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { organizationKeys as organizationKeysV1 } from 'data/organizations/keys'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationCreateInvitationVariables = {
  slug: string
  email: string
  roleId: number
  projects?: string[]
}

export async function createOrganizationInvitation({
  slug,
  email,
  roleId,
  projects,
}: OrganizationCreateInvitationVariables) {
  const payload: components['schemas']['CreateInvitationBody'] = { email, role_id: roleId }
  if (projects !== undefined) payload.role_scoped_projects = projects

  const { data, error } = await post('/platform/organizations/{slug}/members/invitations', {
    params: { path: { slug } },
    body: payload,
  })

  if (error) handleError(error)
  return data
}

type OrganizationMemberUpdateData = Awaited<ReturnType<typeof createOrganizationInvitation>>

export const useOrganizationCreateInvitationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberUpdateData,
    ResponseError,
    OrganizationCreateInvitationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberUpdateData,
    ResponseError,
    OrganizationCreateInvitationVariables
  >((vars) => createOrganizationInvitation(vars), {
    async onSuccess(data, variables, context) {
      const { slug } = variables

      await Promise.all([
        queryClient.invalidateQueries(organizationKeys.rolesV2(slug)),
        queryClient.invalidateQueries(organizationKeysV1.members(slug)),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update member role: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
