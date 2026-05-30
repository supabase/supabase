import { toast } from 'sonner'
import { Button } from 'ui'

import { useInvoicePaymentLinkGetMutation } from '@/data/invoices/invoice-payment-link-mutation'

interface InvoicePayButtonProps {
  slug?: string
  invoiceId: string
}

const InvoicePayButton = ({ slug, invoiceId }: InvoicePayButtonProps) => {
  const { mutate, isPending } = useInvoicePaymentLinkGetMutation({
    onSuccess(data) {
      toast.success('Redirecting to payment gateway...')

      window.location.href = data.redirectUrl
    },
  })

  function onPayNow() {
    mutate({ slug, invoiceId })
  }

  return (
    <Button onClick={onPayNow} loading={isPending} disabled={isPending}>
      Pay now
    </Button>
  )
}

export default InvoicePayButton
