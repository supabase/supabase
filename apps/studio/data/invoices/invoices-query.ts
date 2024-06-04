import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type InvoicesVariables = {
  slug?: string
  offset?: number
  limit?: number
}

export async function getInvoices(
  { slug, offset = 0, limit = 10 }: InvoicesVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('Org slug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/billing/invoices`, {
    params: {
      path: { slug },
      query: { offset: offset.toString(), limit: limit.toString() },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type InvoicesData = Awaited<ReturnType<typeof getInvoices>>
export type InvoicesError = ResponseError

export const useInvoicesQuery = <TData = InvoicesData>(
  { slug, offset, limit }: InvoicesVariables,
  { enabled = true, ...options }: UseQueryOptions<InvoicesData, InvoicesError, TData> = {}
) =>
  // [Joshen] Switch to useInfiniteQuery
  useQuery<InvoicesData, InvoicesError, TData>(
    invoicesKeys.list(slug, offset),
    ({ signal }) => getInvoices({ slug, offset, limit }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
