import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { organizationKeys } from '../organizations/keys'
import type { ResponseError } from 'types'
import { handleError, patch } from 'data/fetchers'
import { components } from 'api-types'

export type OrganizationMemberUpdateVariables = {
  slug: string
  gotrueId: string
  roleId: number
  projects?: string[]
}

export async function updateOrganizationMember({
  slug,
  gotrueId,
  roleId,
  projects,
}: OrganizationMemberUpdateVariables) {
  const payload: components['schemas']['UpdateMemberRoleBodyV2'] = { role_id: roleId }
  if (projects !== undefined) payload.role_scoped_projects = projects

  const { data, error } = await patch('/platform/organizations/{slug}/members/{gotrue_id}', {
    params: { path: { slug, gotrue_id: gotrueId } },
    body: payload,
    headers: { Version: '2' },
  })

  if (error) handleError(error)
  return data
}

type OrganizationMemberUpdateData = Awaited<ReturnType<typeof updateOrganizationMember>>

export const useOrganizationMemberUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberUpdateData,
    ResponseError,
    OrganizationMemberUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberUpdateData,
    ResponseError,
    OrganizationMemberUpdateVariables
  >((vars) => updateOrganizationMember(vars), {
    async onSuccess(data, variables, context) {
      const { slug } = variables

      // await Promise.all([
      //   queryClient.invalidateQueries(organizationKeys.members(slug)),
      //   queryClient.invalidateQueries(organizationKeys.roles(slug)),
      // ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update member: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
