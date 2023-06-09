import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { invoicesKeys } from './keys'

export type UpcomingInvoiceVariables = {
  projectRef?: string
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
  { projectRef }: UpcomingInvoiceVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await get(`${API_URL}/projects/${projectRef}/billing/invoices/upcoming`, {
    signal,
  })
  if (response.error) throw response.error

  return response as UpcomingInvoiceResponse
}

export type UpcomingInvoiceData = Awaited<ReturnType<typeof getUpcomingInvoice>>
export type UpcomingInvoiceError = unknown

export const useUpcomingInvoiceQuery = <TData = UpcomingInvoiceData>(
  { projectRef }: UpcomingInvoiceVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UpcomingInvoiceData, UpcomingInvoiceError, TData> = {}
) =>
  useQuery<UpcomingInvoiceData, UpcomingInvoiceError, TData>(
    invoicesKeys.upcomingPreview(projectRef),
    ({ signal }) => getUpcomingInvoice({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useUpcomingInvoicePrefetch = ({ projectRef }: UpcomingInvoiceVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(invoicesKeys.upcomingPreview(projectRef), ({ signal }) =>
        getUpcomingInvoice({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
