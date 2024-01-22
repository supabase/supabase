import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { head } from 'data/fetchers'
import { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type InvoicesCountVariables = {
  customerId?: string
  slug?: string
}

export async function getInvoicesCount(
  { customerId, slug }: InvoicesCountVariables,
  signal?: AbortSignal
) {
  if (!customerId) throw new Error('Customer ID is required')
  if (!slug) throw new Error('Slug is required')

  const res = await head(`/platform/stripe/invoices`, {
    params: { query: { customer: customerId, slug } },
    signal,
    parseAs: 'text',
  })

  if (res.error) throw (res as any).error
  return Number(res.response.headers.get('X-Total-Count'))
}

export type InvoicesCountData = Awaited<ReturnType<typeof getInvoicesCount>>
export type InvoicesCountError = ResponseError

export const useInvoicesCountQuery = <TData = InvoicesCountData>(
  { customerId, slug }: InvoicesCountVariables,
  { enabled = true, ...options }: UseQueryOptions<InvoicesCountData, InvoicesCountError, TData> = {}
) =>
  useQuery<InvoicesCountData, InvoicesCountError, TData>(
    invoicesKeys.count(customerId, slug),
    ({ signal }) => getInvoicesCount({ customerId, slug }, signal),
    {
      enabled: enabled && typeof customerId !== 'undefined' && typeof slug !== 'undefined',
      ...options,
    }
  )
