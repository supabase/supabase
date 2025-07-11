import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from '../fetchers'
import type { ResponseError } from '../../types'

export type OrganizationLinkAwsMarketplaceVariables = {
  buyerId: string
  slug: string
}

export async function linkOrganization({ buyerId, slug }: OrganizationLinkAwsMarketplaceVariables) {
  const { data, error } = await put(`/platform/organizations/{slug}/cloud-marketplace/link`, {
    params: { path: { slug } },
    body: {
      buyer_id: buyerId,
    },
  })

  if (error) handleError(error)

  return data
}

type ClazarConnectData = Awaited<ReturnType<typeof linkOrganization>>

export const useOrganizationLinkAwsMarketplaceMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ClazarConnectData, ResponseError, OrganizationLinkAwsMarketplaceVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<ClazarConnectData, ResponseError, OrganizationLinkAwsMarketplaceVariables>(
    (vars) => linkOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to link organization to AWS marketplace: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
