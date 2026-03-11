import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError, UseCustomMutationOptions } from '../../types'
import { handleError, put } from '../fetchers'

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
  onError,
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
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to link organization to AWS Marketplace: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
