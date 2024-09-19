import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
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

      await Promise.all([
        queryClient.invalidateQueries(organizationKeys.members(slug)),
        queryClient.invalidateQueries(organizationKeys.roles(slug)),
      ])

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
