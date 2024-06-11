import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { components } from 'api-types'
import { handleError, del } from 'data/fetchers'
import type { ResponseError } from 'types'

export type OrganizationDeclineInvitationVariables = {
  slug: string
  id: number
}

export async function declineOrganizationInvitation({
  slug,
  id,
}: OrganizationDeclineInvitationVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/members/invitations/{id}', {
    params: { path: { slug, id } },
  })

  if (error) handleError(error)
  return data
}

type OrganizationMemberUpdateData = Awaited<ReturnType<typeof declineOrganizationInvitation>>

export const useOrganizationDeclineInvitationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberUpdateData,
    ResponseError,
    OrganizationDeclineInvitationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberUpdateData,
    ResponseError,
    OrganizationDeclineInvitationVariables
  >((vars) => declineOrganizationInvitation(vars), {
    async onSuccess(data, variables, context) {
      const { slug } = variables

      // if (!skipInvalidation) {
      //   await Promise.all([
      //     queryClient.invalidateQueries(organizationKeys.rolesV2(slug)),
      //     queryClient.invalidateQueries(organizationKeysV1.members(slug)),
      //   ])
      // }

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to decline invitation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
