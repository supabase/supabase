import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import type { SubscriptionTier } from 'data/subscriptions/types'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationBillingSubscriptionPreviewVariables = {
  organizationSlug?: string
  tier?: SubscriptionTier
}

export type OrganizationBillingSubscriptionPreviewResponse = {
  breakdown: {
    description: string
    unit_price: number
    unit_price_desc?: string
    quantity?: number
    total_price: number
    breakdown: {
      project_name: string
      project_ref: string
      usage: number
    }[]
  }[]
  number_of_projects?: number
  plan_change_type?: 'downgrade' | 'none' | 'upgrade'
  active_projects?: {
    status:
      | 'INACTIVE'
      | 'ACTIVE_HEALTHY'
      | 'ACTIVE_UNHEALTHY'
      | 'COMING_UP'
      | 'UNKNOWN'
      | 'GOING_DOWN'
      | 'INIT_FAILED'
      | 'REMOVED'
      | 'RESTORING'
      | 'RESTARTING'
      | 'RESIZING'
      | 'UPGRADING'
    instance_size: string
    name: string
    ref: string
  }[]
  billed_via_partner?: boolean
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

  return data as OrganizationBillingSubscriptionPreviewResponse
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
  }: UseQueryOptions<OrganizationBillingSubscriptionPreviewData, ResponseError, TData> = {}
) =>
  useQuery<OrganizationBillingSubscriptionPreviewData, ResponseError, TData>(
    organizationKeys.subscriptionPreview(organizationSlug, tier),
    () => previewOrganizationBillingSubscription({ organizationSlug, tier }),
    {
      enabled: enabled && typeof organizationSlug !== 'undefined' && typeof tier !== 'undefined',
      ...options,

      retry: (failureCount, error) => {
        // Don't retry on 400s
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as any).code === 400
        ) {
          return false
        }

        if (failureCount < 3) {
          return true
        }

        return false
      },
    }
  )
