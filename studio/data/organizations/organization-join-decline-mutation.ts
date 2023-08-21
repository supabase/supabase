import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del } from 'data/fetchers'
import { ResponseError } from 'types'

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
  if (error) throw error
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
