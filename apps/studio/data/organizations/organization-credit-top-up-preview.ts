import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { organizationKeys } from './keys'
import type { CustomerAddress, CustomerTaxId } from './types'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type CreditTopUpPreviewVariables = {
  slug?: string
  amount?: number
  address?: CustomerAddress
  taxId?: CustomerTaxId
}

export async function previewCreditTopUp({
  slug,
  amount,
  address,
  taxId,
}: CreditTopUpPreviewVariables) {
  if (!slug) throw new Error('slug is required')
  if (!amount) throw new Error('amount is required')

  const { data, error } = await post(`/platform/organizations/{slug}/billing/credits/preview`, {
    params: { path: { slug } },
    body: {
      amount,
      ...(address && { address }),
      ...(taxId && { tax_id: taxId }),
    },
  })

  if (error) handleError(error)

  return data
}

export type CreditTopUpPreviewData = Awaited<ReturnType<typeof previewCreditTopUp>>

export const useCreditTopUpPreview = <TData = CreditTopUpPreviewData>(
  { slug, amount, address, taxId }: CreditTopUpPreviewVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<CreditTopUpPreviewData, ResponseError, TData> = {}
) =>
  useQuery<CreditTopUpPreviewData, ResponseError, TData>({
    queryKey: organizationKeys.creditTopUpPreview(slug, {
      amount,
      address: address as Record<string, unknown> | undefined,
      taxId: taxId as Record<string, unknown> | undefined,
    }),
    queryFn: () => previewCreditTopUp({ slug, amount, address, taxId }),
    enabled: enabled && typeof slug !== 'undefined' && typeof amount !== 'undefined',
    placeholderData: keepPreviousData,
    ...options,
  })
