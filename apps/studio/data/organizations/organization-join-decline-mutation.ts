import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

// [Joshen] This is a duplicate of organization-member-invite-delete-mutation, to remove one of them

export type OrganizationJoinDeclineVariables = {
  slug: string
  invited_id: string
}

export async function declineJoinOrganization({
  slug,
  invited_id,
}: OrganizationJoinDeclineVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/members/invite', {
    // @ts-ignore [Joshen] API spec might be wrong here
    params: { path: { slug }, query: { invited_id } },
  })
  if (error) handleError(error)
  return data
}

type OrganizationJoinDeclineData = Awaited<ReturnType<typeof declineJoinOrganization>>

export const useOrganizationJoinDeclineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationJoinDeclineData, ResponseError, OrganizationJoinDeclineVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<OrganizationJoinDeclineData, ResponseError, OrganizationJoinDeclineVariables>(
    (vars) => declineJoinOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to decline organization invite: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
