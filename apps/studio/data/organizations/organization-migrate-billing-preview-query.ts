import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'
import { SubscriptionTier } from 'data/subscriptions/types'

export type OrganizationBillingMigrationPreviewVariables = {
  organizationSlug?: string
  tier?: string
}

export type OrganizationBillingMigrationPreviewResponse = {
  added_credits: number
  addons_to_be_removed: {
    projectRef: string
    projectName: string
    addons: { variant: string; name: string; type: string }[]
  }[]
  monthly_invoice_breakdown: {
    description: string
    unit_price: number
    quantity: number
    total_price: number
  }[]
  old_tiers: SubscriptionTier[]
}

export async function previewOrganizationBillingMigration(
  { organizationSlug, tier }: OrganizationBillingMigrationPreviewVariables,
  signal?: AbortSignal
) {
  if (!organizationSlug) throw new Error('organizationSlug is required')
  if (!tier) throw new Error('tier is required')

  const payload: { tier: string } = {
    tier,
  }

  const response = await post(
    `${API_URL}/organizations/${organizationSlug}/org-billing-migration/preview`,
    payload,
    { signal }
  )

  if (response.error) throw response.error

  return response as OrganizationBillingMigrationPreviewResponse
}

export type OrganizationBillingMigrationPreviewData = Awaited<
  ReturnType<typeof previewOrganizationBillingMigration>
>
export type OrganizationBillingMigrationPreviewError = {
  message: string
}

export const useOrganizationBillingMigrationPreview = <
  TData = OrganizationBillingMigrationPreviewData
>(
  { organizationSlug, tier }: OrganizationBillingMigrationPreviewVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    OrganizationBillingMigrationPreviewData,
    OrganizationBillingMigrationPreviewError,
    TData
  > = {}
) =>
  useQuery<
    OrganizationBillingMigrationPreviewData,
    OrganizationBillingMigrationPreviewError,
    TData
  >(
    organizationKeys.migrateBillingPreview(organizationSlug),
    ({ signal }) => previewOrganizationBillingMigration({ organizationSlug, tier }, signal),
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
