import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { invoicesKeys } from './keys'

export type InvoicePaymentLinkGetVariables = {
  slug?: string
  invoiceId?: string
}

export async function updateInvoicePaymentLink({
  slug,
  invoiceId,
}: InvoicePaymentLinkGetVariables) {
  if (!slug) throw new Error('Org slug is required')
  if (!invoiceId) throw new Error('Invoice ID is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/billing/invoices/{invoice_id}/payment-link',
    {
      params: {
        path: {
          slug,
          invoice_id: invoiceId,
        },
      },
    }
  )

  if (error) handleError(error)
  return data
}

type InvoicePaymentLinkGetData = Awaited<ReturnType<typeof updateInvoicePaymentLink>>

export const useInvoicePaymentLinkGetMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    InvoicePaymentLinkGetData,
    ResponseError,
    InvoicePaymentLinkGetVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<InvoicePaymentLinkGetData, ResponseError, InvoicePaymentLinkGetVariables>({
    mutationFn: (vars) => updateInvoicePaymentLink(vars),
    async onError(error, variables, context) {
      // In case of an error, there is a good chance that the invoice status has changed, so we invalidate the cache to reflect the updated status
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoicesKeys.listAndCount(variables.slug) }),
      ])

      if (onError === undefined) {
        toast.error(error.message)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
