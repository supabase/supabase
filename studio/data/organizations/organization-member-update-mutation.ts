import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'

export type OrganizationMemberUpdateVariables = {
  slug: string
  gotrueId: string
  roleId: number
}

export async function updateOrganizationMember({
  slug,
  gotrueId,
  roleId,
}: OrganizationMemberUpdateVariables) {
  const response = await patch(`${API_URL}/organizations/${slug}/members/${gotrueId}`, {
    role_id: roleId,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type OrganizationMemberUpdateData = Awaited<ReturnType<typeof updateOrganizationMember>>

export const useOrganizationMemberUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<OrganizationMemberUpdateData, unknown, OrganizationMemberUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationMemberUpdateData, unknown, OrganizationMemberUpdateVariables>(
    (vars) => updateOrganizationMember(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables

        await Promise.all([
          queryClient.invalidateQueries(organizationKeys.detail(slug)),
          queryClient.invalidateQueries(organizationKeys.roles(slug)),
        ])

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
