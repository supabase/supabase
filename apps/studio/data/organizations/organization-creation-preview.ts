import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { organizationKeys } from './keys'
import type { CustomerAddress, CustomerTaxId } from './types'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OrganizationCreationPreviewVariables = {
  tier?: string
  address?: CustomerAddress
  taxId?: CustomerTaxId
}

export type OrganizationCreationPreviewResponse = {
  currency: string
  plan_price: number
  tax: {
    currency: string
    tax_amount: number
    tax_rate_percentage: number
    total_amount_excluding_tax: number
    total_amount_including_tax: number
  } | null
  tax_status: 'calculated' | 'not_applicable' | 'failed'
  total: number
}

export async function previewOrganizationCreation({
  tier,
  address,
  taxId,
}: OrganizationCreationPreviewVariables) {
  if (!tier) throw new Error('tier is required')

  const { data, error } = await post(`/platform/organizations/preview-creation`, {
    body: {
      tier: tier as 'tier_pro' | 'tier_payg' | 'tier_team',
      ...(address && { address }),
      ...(taxId && { tax_id: taxId }),
    },
  })

  if (error) handleError(error)

  return data as OrganizationCreationPreviewResponse
}

export type OrganizationCreationPreviewData = Awaited<
  ReturnType<typeof previewOrganizationCreation>
>

export const useOrganizationCreationPreview = <TData = OrganizationCreationPreviewData>(
  { tier, address, taxId }: OrganizationCreationPreviewVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationCreationPreviewData, ResponseError, TData> = {}
) =>
  useQuery<OrganizationCreationPreviewData, ResponseError, TData>({
    queryKey: organizationKeys.creationPreview(tier, {
      address: address as Record<string, unknown> | undefined,
      taxId: taxId as Record<string, unknown> | undefined,
    }),
    queryFn: () => previewOrganizationCreation({ tier, address, taxId }),
    enabled: enabled && typeof tier !== 'undefined',
    placeholderData: keepPreviousData,
    ...options,
  })
