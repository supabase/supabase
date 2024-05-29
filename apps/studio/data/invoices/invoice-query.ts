import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type InvoiceVariables = {
  invoiceId?: string
  slug?: string
}

export async function getInvoice({ invoiceId, slug }: InvoiceVariables, signal?: AbortSignal) {
  if (!invoiceId) throw new Error('Invoice ID is required')
  if (!slug) throw new Error('Slug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/billing/invoices/{invoiceId}`, {
    params: { path: { invoiceId, slug } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type InvoiceData = Awaited<ReturnType<typeof getInvoice>>
export type InvoiceError = ResponseError

export const useInvoiceQuery = <TData = InvoiceData>(
  { invoiceId: id }: InvoiceVariables,
  { enabled = true, ...options }: UseQueryOptions<InvoiceData, InvoiceError, TData> = {}
) =>
  useQuery<InvoiceData, InvoiceError, TData>(
    invoicesKeys.invoice(id),
    ({ signal }) => getInvoice({ invoiceId: id }, signal),
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )
