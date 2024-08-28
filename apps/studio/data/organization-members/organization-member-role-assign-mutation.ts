import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { organizationKeys } from './keys'
import { organizationKeys as organizationKeysV1 } from 'data/organizations/keys'
import type { ResponseError } from 'types'
import { handleError, patch } from 'data/fetchers'
import { components } from 'api-types'

export type OrganizationMemberAssignRoleVariables = {
  slug: string
  gotrueId: string
  roleId: number
  projects?: string[]
  skipInvalidation?: boolean
}

export async function assignOrganizationMemberRole({
  slug,
  gotrueId,
  roleId,
  projects,
}: OrganizationMemberAssignRoleVariables) {
  const payload: components['schemas']['AssignMemberRoleBodyV2'] = { role_id: roleId }
  if (projects !== undefined) payload.role_scoped_projects = projects

  const { data, error } = await patch('/platform/organizations/{slug}/members/{gotrue_id}', {
    params: { path: { slug, gotrue_id: gotrueId } },
    body: payload,
    headers: { Version: '2' },
  })

  if (error) handleError(error)
  return data
}

type OrganizationMemberAssignData = Awaited<ReturnType<typeof assignOrganizationMemberRole>>

export const useOrganizationMemberAssignRoleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberAssignData,
    ResponseError,
    OrganizationMemberAssignRoleVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberAssignData,
    ResponseError,
    OrganizationMemberAssignRoleVariables
  >((vars) => assignOrganizationMemberRole(vars), {
    async onSuccess(data, variables, context) {
      const { slug, skipInvalidation } = variables

      if (!skipInvalidation) {
        await Promise.all([
          queryClient.invalidateQueries(organizationKeys.rolesV2(slug)),
          queryClient.invalidateQueries(organizationKeysV1.members(slug)),
        ])
      }

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
