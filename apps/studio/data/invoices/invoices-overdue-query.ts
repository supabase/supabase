import { createQuery } from 'react-query-kit'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'

export type OverdueInvoicesResponse = components['schemas']['OverdueInvoiceCount']

export async function getOverdueInvoices(_: void, { signal }: { signal: AbortSignal }) {
  const { data, error } = await get('/platform/stripe/invoices/overdue', {
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OverdueInvoicesData = Awaited<ReturnType<typeof getOverdueInvoices>>
export type OverdueInvoicesError = unknown

export const useOverdueInvoicesQuery = createQuery<OverdueInvoicesData, void, OverdueInvoicesError>(
  {
    queryKey: ['invoices', 'overdue'],
    fetcher: getOverdueInvoices,
    enabled: IS_PLATFORM,
  }
)
