import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { invoicesKeys } from './keys'

export type OverdueInvoicesResponse = {
  id: string
  organization_id: number
}

export async function getOverdueInvoices(signal?: AbortSignal) {
  const response = await get(`${API_URL}/stripe/invoices/overdue`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as OverdueInvoicesResponse[]
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
