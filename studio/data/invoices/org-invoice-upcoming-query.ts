import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { invoicesKeys } from './keys'
import { ResponseError } from 'types'

// [Joshen] This can eventually superseded and overwrite invoice-upcoming-query once we completely move to org billing

export type UpcomingInvoiceVariables = {
  orgSlug?: string
}

export type UpcomingInvoiceResponse = {
  amount_total: number
  currency: string
  customer_balance: number
  subscription_id: string
  billing_cycle_end: string
  billing_cycle_start: string
  lines: {
    amount: number
    description: string
    period: { start: string; end: string }
    quantity: number
    unit_price: number
    usage_based: boolean
  }[]
}

export async function getUpcomingInvoice(
  { orgSlug }: UpcomingInvoiceVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const response = await get(`${API_URL}/organizations/${orgSlug}/billing/invoices/upcoming`, {
    signal,
  })
  if (response.error) throw response.error
  return response as UpcomingInvoiceResponse
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

export const useOrgUpcomingInvoicePrefetch = ({ orgSlug }: UpcomingInvoiceVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (orgSlug) {
      client.prefetchQuery(invoicesKeys.orgUpcomingPreview(orgSlug), ({ signal }) =>
        getUpcomingInvoice({ orgSlug }, signal)
      )
    }
  }, [client, orgSlug])
}
