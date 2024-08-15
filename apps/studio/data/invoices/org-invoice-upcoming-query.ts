import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type UpcomingInvoiceVariables = {
  orgSlug?: string
}

export type UpcomingInvoiceResponse = {
  amount_projected: number
  amount_total: number
  currency: string
  customer_balance: number
  subscription_id: string
  billing_cycle_end: string
  billing_cycle_start: string
  lines: {
    amount: number
    description: string
    proration: boolean
    period: { start: string; end: string }
    quantity?: number
    unit_price: number
    unit_price_desc: string
    usage_based: boolean
    usage_metric?: PricingMetric
    usage_original?: number
    breakdown: {
      project_ref: string
      project_name: string
      usage: number
    }[]
  }[]
}

export async function getUpcomingInvoice(
  { orgSlug }: UpcomingInvoiceVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/billing/invoices/upcoming`, {
    params: { path: { slug: orgSlug } },
    headers: {
      Version: '2',
    },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as UpcomingInvoiceResponse
}

export type UpcomingInvoiceData = Awaited<ReturnType<typeof getUpcomingInvoice>>
export type UpcomingInvoiceError = ResponseError

export const useOrgUpcomingInvoiceQuery = <TData = UpcomingInvoiceData>(
  { orgSlug }: UpcomingInvoiceVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UpcomingInvoiceData, UpcomingInvoiceError, TData> = {}
) =>
  useQuery<UpcomingInvoiceData, UpcomingInvoiceError, TData>(
    invoicesKeys.orgUpcomingPreview(orgSlug),
    ({ signal }) => getUpcomingInvoice({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
