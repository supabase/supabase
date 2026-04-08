import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { organizationKeys } from './keys'
import type { CustomerAddress, CustomerTaxId } from './types'
import { handleError, post } from '@/data/fetchers'
import type { SubscriptionTier } from '@/data/subscriptions/types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OrganizationBillingSubscriptionPreviewVariables = {
  organizationSlug?: string
  tier?: SubscriptionTier
  address?: CustomerAddress
  taxId?: CustomerTaxId
}

export async function previewOrganizationBillingSubscription({
  organizationSlug,
  tier,
  address,
  taxId,
}: OrganizationBillingSubscriptionPreviewVariables) {
  if (!organizationSlug) throw new Error('organizationSlug is required')
  if (!tier) throw new Error('tier is required')

  const { data, error } = await post(
    `/platform/organizations/{slug}/billing/subscription/preview`,
    {
      params: { path: { slug: organizationSlug } },
      body: {
        tier,
        ...(address && { address }),
        ...(taxId && { tax_id: taxId }),
      },
      headers: {
        Version: '2',
      },
    }
  )

  if (error) handleError(error)

  return data
}

export type OrganizationBillingSubscriptionPreviewData = Awaited<
  ReturnType<typeof previewOrganizationBillingSubscription>
>

export const useOrganizationBillingSubscriptionPreview = <
  TData = OrganizationBillingSubscriptionPreviewData,
>(
  { organizationSlug, tier, address, taxId }: OrganizationBillingSubscriptionPreviewVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationBillingSubscriptionPreviewData, ResponseError, TData> = {}
) =>
  useQuery<OrganizationBillingSubscriptionPreviewData, ResponseError, TData>({
    queryKey: organizationKeys.subscriptionPreview(organizationSlug, tier, {
      address: address as Record<string, unknown> | undefined,
      taxId: taxId as Record<string, unknown> | undefined,
    }),
    queryFn: () =>
      previewOrganizationBillingSubscription({ organizationSlug, tier, address, taxId }),
    enabled: enabled && typeof organizationSlug !== 'undefined' && typeof tier !== 'undefined',
    placeholderData: keepPreviousData,
    ...options,
  })
