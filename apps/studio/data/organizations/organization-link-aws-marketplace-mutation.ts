import { useMutation } from '@tanstack/react-query'

import { handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

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

type LinkOrganizationData = Awaited<ReturnType<typeof linkOrganization>>

export const useOrganizationLinkAwsMarketplaceMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    LinkOrganizationData,
    ResponseError,
    OrganizationLinkAwsMarketplaceVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<LinkOrganizationData, ResponseError, OrganizationLinkAwsMarketplaceVariables>({
    mutationFn: (vars) => linkOrganization(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
