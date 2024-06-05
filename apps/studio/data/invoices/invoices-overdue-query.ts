import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { invoicesKeys } from './keys'

export type OverdueInvoicesResponse = components['schemas']['OverdueInvoiceCount']

export async function getOverdueInvoices(signal?: AbortSignal) {
  const { data, error } = await get('/platform/stripe/invoices/overdue', {
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OverdueInvoicesData = Awaited<ReturnType<typeof getOverdueInvoices>>
export type OverdueInvoicesError = unknown

export const useOverdueInvoicesQuery = <TData = OverdueInvoicesData>({
  enabled = true,
  ...options
}: UseQueryOptions<OverdueInvoicesData, OverdueInvoicesError, TData> = {}) =>
  useQuery<OverdueInvoicesData, OverdueInvoicesError, TData>(
    invoicesKeys.overdueInvoices(),
    ({ signal }) => getOverdueInvoices(signal),
    { enabled, ...options }
  )
