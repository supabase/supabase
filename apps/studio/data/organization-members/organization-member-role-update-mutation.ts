import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, put } from 'data/fetchers'
import { organizationKeys as organizationKeysV1 } from 'data/organizations/keys'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMemberUpdateRoleVariables = {
  slug: string
  gotrueId: string
  roleId: number
  roleName: string
  projects: string[]
  skipInvalidation?: boolean
}

export async function assignOrganizationMemberRole({
  slug,
  gotrueId,
  roleId,
  roleName,
  projects,
}: OrganizationMemberUpdateRoleVariables) {
  const { data, error } = await put(
    '/platform/organizations/{slug}/members/{gotrue_id}/roles/{role_id}',
    {
      params: { path: { slug, gotrue_id: gotrueId, role_id: roleId.toString() } },
      body: { name: roleName, role_scoped_projects: projects },
    }
  )

  if (error) handleError(error)
  return data
}

type OrganizationMemberAssignData = Awaited<ReturnType<typeof assignOrganizationMemberRole>>

export const useOrganizationMemberUpdateRoleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberAssignData,
    ResponseError,
    OrganizationMemberUpdateRoleVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberAssignData,
    ResponseError,
    OrganizationMemberUpdateRoleVariables
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
