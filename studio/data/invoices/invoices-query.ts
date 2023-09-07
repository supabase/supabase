import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type InvoicesVariables = {
  customerId?: string
  slug?: string
  offset?: number
  limit?: number
}

export async function getInvoices(
  { customerId, slug, offset = 0, limit = 10 }: InvoicesVariables,
  signal?: AbortSignal
) {
  if (!customerId) throw new Error('Customer ID is required')
  if (!slug) throw new Error('Org slug is required')

  const { data, error } = await get(`/platform/stripe/invoices`, {
    params: {
      // @ts-ignore: [Joshen] Might be API spec wrong
      query: { offset: offset.toString(), limit: limit.toString(), customer: customerId, slug },
    },
    signal,
  })

  if (error) throw error
  return data
}

export type InvoicesData = Awaited<ReturnType<typeof getInvoices>>
export type InvoicesError = ResponseError

export const useInvoicesQuery = <TData = InvoicesData>(
  { customerId, slug, offset, limit }: InvoicesVariables,
  { enabled = true, ...options }: UseQueryOptions<InvoicesData, InvoicesError, TData> = {}
) =>
  // [Joshen] Switch to useInfiniteQuery
  useQuery<InvoicesData, InvoicesError, TData>(
    invoicesKeys.list(customerId, slug, offset),
    ({ signal }) => getInvoices({ customerId, slug, offset, limit }, signal),
    {
      enabled: enabled && typeof customerId !== 'undefined' && typeof slug !== 'undefined',
      ...options,
    }
  )
