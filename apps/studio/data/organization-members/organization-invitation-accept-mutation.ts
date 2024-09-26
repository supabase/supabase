import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import type { ResponseError } from 'types'

export type OrganizationAcceptInvitationVariables = {
  slug: string
  token: string
}

export async function acceptOrganizationInvitation({
  slug,
  token,
}: OrganizationAcceptInvitationVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/members/invitations/{token}', {
    params: { path: { slug, token } },
  })

  if (error) handleError(error)
  return data
}

type OrganizationMemberUpdateData = Awaited<ReturnType<typeof acceptOrganizationInvitation>>

export const useOrganizationAcceptInvitationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberUpdateData,
    ResponseError,
    OrganizationAcceptInvitationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberUpdateData,
    ResponseError,
    OrganizationAcceptInvitationVariables
  >((vars) => acceptOrganizationInvitation(vars), {
    async onSuccess(data, variables, context) {
      await invalidateOrganizationsQuery(queryClient)

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to accept invitation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
