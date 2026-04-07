import { useQuery } from '@tanstack/react-query'

import { organizationKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { SubscriptionTier } from '@/data/subscriptions/types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OrganizationBillingSubscriptionPreviewVariables = {
  organizationSlug?: string
  tier?: SubscriptionTier
}

export async function previewOrganizationBillingSubscription({
  organizationSlug,
  tier,
}: OrganizationBillingSubscriptionPreviewVariables) {
  if (!organizationSlug) throw new Error('organizationSlug is required')
  if (!tier) throw new Error('tier is required')

  const { data, error } = await post(
    `/platform/organizations/{slug}/billing/subscription/preview`,
    {
      params: { path: { slug: organizationSlug } },
      body: {
        tier,
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
  { organizationSlug, tier }: OrganizationBillingSubscriptionPreviewVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationBillingSubscriptionPreviewData, ResponseError, TData> = {}
) =>
  useQuery<OrganizationBillingSubscriptionPreviewData, ResponseError, TData>({
    queryKey: organizationKeys.subscriptionPreview(organizationSlug, tier),
    queryFn: () => previewOrganizationBillingSubscription({ organizationSlug, tier }),
    enabled: enabled && typeof organizationSlug !== 'undefined' && typeof tier !== 'undefined',
    ...options,
  })
