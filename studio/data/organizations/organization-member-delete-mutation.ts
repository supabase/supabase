import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'

export type OrganizationMemberDeleteVariables = {
  slug: string
  gotrueId: string
}

export async function deleteOrganizationMember({
  slug,
  gotrueId,
}: OrganizationMemberDeleteVariables) {
  const response = await delete_(`${API_URL}/organizations/${slug}/members/${gotrueId}`)
  if (response.error) {
    throw response.error
  }

  return response
}

type OrganizationMemberDeleteData = Awaited<ReturnType<typeof deleteOrganizationMember>>

export const useOrganizationMemberDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<OrganizationMemberDeleteData, unknown, OrganizationMemberDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationMemberDeleteData, unknown, OrganizationMemberDeleteVariables>(
    (vars) => deleteOrganizationMember(vars),
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
