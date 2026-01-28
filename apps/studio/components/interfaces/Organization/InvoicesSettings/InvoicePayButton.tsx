import { useInvoicePaymentLinkGetMutation } from 'data/invoices/invoice-payment-link-mutation'
import { toast } from 'sonner'
import { Button } from 'ui'

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
