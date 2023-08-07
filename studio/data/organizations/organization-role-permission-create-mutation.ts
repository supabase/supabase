import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationRolePermissionCreateVariables = {
  slug: string
  roleId: number
  actions: string[]
  resources: string[]
  condition: object
  restrictive: boolean
}

export async function createOrganizationRolePermission({
  slug,
  roleId,
  actions,
  resources,
  condition,
  restrictive,
}: OrganizationRolePermissionCreateVariables) {
  const response = await post(`${API_URL}/organizations/${slug}/roles/${roleId}/permissions`, {
    actions,
    resources,
    condition,
    restrictive,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type OrganizationRolePermissionCreateData = Awaited<
  ReturnType<typeof createOrganizationRolePermission>
>

export const useOrganizationRolePermissionCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationRolePermissionCreateData,
    ResponseError,
    OrganizationRolePermissionCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationRolePermissionCreateData,
    ResponseError,
    OrganizationRolePermissionCreateVariables
  >((vars) => createOrganizationRolePermission(vars), {
    async onSuccess(data, variables, context) {
      const { slug, roleId } = variables

      await Promise.all([
        queryClient.invalidateQueries(organizationKeys.rolePermissions(slug, roleId)),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create role permission: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
