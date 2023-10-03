import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMemberInviteDeleteVariables = {
  slug: string
  invitedId: number
  invalidateDetail?: boolean
}

export async function deleteOrganizationMemberInvite({
  slug,
  invitedId,
}: OrganizationMemberInviteDeleteVariables) {
  const response = await delete_(
    `${API_URL}/organizations/${slug}/members/invite?invited_id=${invitedId}`,
    {}
  )
  if (response.error) throw response.error
  return response
}

type OrganizationMemberInviteDeleteData = Awaited<ReturnType<typeof deleteOrganizationMemberInvite>>

export const useOrganizationMemberInviteDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberInviteDeleteData,
    ResponseError,
    OrganizationMemberInviteDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberInviteDeleteData,
    ResponseError,
    OrganizationMemberInviteDeleteVariables
  >((vars) => deleteOrganizationMemberInvite(vars), {
    async onSuccess(data, variables, context) {
      const { slug, invalidateDetail } = variables

      await Promise.all([
        ...(invalidateDetail ?? true
          ? [queryClient.invalidateQueries(organizationKeys.detail(slug))]
          : []),
        queryClient.invalidateQueries(organizationKeys.roles(slug)),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to revoke invitation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
