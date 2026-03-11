import { get, handleError } from 'data/fetchers'

export type InvoiceReceiptVariables = {
  invoiceId: string
  slug: string
}

export async function getInvoiceReceipt(
  { invoiceId, slug }: InvoiceReceiptVariables,
  signal?: AbortSignal
) {
  if (!invoiceId) throw new Error('Invoice ID is required')
  if (!slug) throw new Error('Slug is required')

  const { data, error } = await get(
    `/platform/organizations/{slug}/billing/invoices/{invoice_id}/receipt`,
    {
      params: { path: { invoice_id: invoiceId, slug } },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}
