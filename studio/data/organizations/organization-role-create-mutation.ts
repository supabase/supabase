import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationRoleCreateVariables = {
  slug: string
  name: string
  description: string
  baseRoleId: number
}

export async function createOrganizationRole({
  slug,
  name,
  description,
  baseRoleId,
}: OrganizationRoleCreateVariables) {
  const response = await post(`${API_URL}/organizations/${slug}/roles`, {
    name,
    description,
    base_role_id: baseRoleId,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type OrganizationRoleCreateData = Awaited<ReturnType<typeof createOrganizationRole>>

export const useOrganizationRoleCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationRoleCreateData, ResponseError, OrganizationRoleCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationRoleCreateData, ResponseError, OrganizationRoleCreateVariables>(
    (vars) => createOrganizationRole(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables

        await Promise.all([
          queryClient.invalidateQueries(organizationKeys.detail(slug)),
          queryClient.invalidateQueries(organizationKeys.roles(slug)),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
