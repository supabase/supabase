import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { head } from 'data/fetchers'
import type { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type InvoicesCountVariables = {
  slug?: string
}

export async function getInvoicesCount({ slug }: InvoicesCountVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('Slug is required')

  const res = await head('/platform/organizations/{slug}/billing/invoices', {
    params: { path: { slug } },
    signal,
    parseAs: 'text',
  })

  if (res.error) throw (res as any).error
  return Number(res.response.headers.get('X-Total-Count'))
}

export type InvoicesCountData = Awaited<ReturnType<typeof getInvoicesCount>>
export type InvoicesCountError = ResponseError

export const useInvoicesCountQuery = <TData = InvoicesCountData>(
  { slug }: InvoicesCountVariables,
  { enabled = true, ...options }: UseQueryOptions<InvoicesCountData, InvoicesCountError, TData> = {}
) =>
  useQuery<InvoicesCountData, InvoicesCountError, TData>(
    invoicesKeys.count(slug),
    ({ signal }) => getInvoicesCount({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
