import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type InvoiceVariables = {
  id?: string
}

export async function getInvoice({ id }: InvoiceVariables, signal?: AbortSignal) {
  if (!id) throw new Error('Invoice ID is required')

  const { data, error } = await get(`/platform/stripe/invoices/{id}`, {
    params: { path: { id } },
    signal,
  })

  if (error) throw error
  return data
}

export type InvoiceData = Awaited<ReturnType<typeof getInvoice>>
export type InvoiceError = ResponseError

export const useInvoiceQuery = <TData = InvoiceData>(
  { id }: InvoiceVariables,
  { enabled = true, ...options }: UseQueryOptions<InvoiceData, InvoiceError, TData> = {}
) =>
  useQuery<InvoiceData, InvoiceError, TData>(
    invoicesKeys.invoice(id),
    ({ signal }) => getInvoice({ id }, signal),
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )
