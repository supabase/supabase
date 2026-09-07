import { useMutation, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { organizationKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import { organizationKeys as organizationKeysV1 } from '@/data/organizations/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OrganizationCreateInvitationVariables = {
  slug: string
  emails: string[]
  roleId: number
  projects?: string[]
  requireSso?: boolean
}

export async function createOrganizationInvitation({
  slug,
  emails,
  roleId,
  projects,
  requireSso,
}: OrganizationCreateInvitationVariables) {
  const payload: components['schemas']['CreateInvitationBody'] = { emails, role_id: roleId }
  if (projects !== undefined) payload.role_scoped_projects = projects
  if (requireSso !== undefined) payload.require_sso = requireSso

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
  UseCustomMutationOptions<
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
  >({
    mutationFn: (vars) => createOrganizationInvitation(vars),
    async onSuccess(data, variables, context) {
      const { slug } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.rolesV2(slug) }),
        queryClient.invalidateQueries({ queryKey: organizationKeysV1.members(slug) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to send invitation${data.message ? ': ' + data.message : ''}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
