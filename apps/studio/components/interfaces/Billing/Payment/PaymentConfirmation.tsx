import { useStripe } from '@stripe/react-stripe-js'
import { PaymentIntentResult } from '@stripe/stripe-js'
import { useEffect } from 'react'
import { LoadingLine } from 'ui'

export const PaymentConfirmation = ({
  paymentIntentSecret,
  onPaymentIntentConfirm,
  onLoadingChange,
  paymentMethodId,
  onError,
}: {
  paymentIntentSecret: string
  paymentMethodId: string
  onPaymentIntentConfirm: (response: PaymentIntentResult) => void
  onLoadingChange: (loading: boolean) => void
  onError?: (error: Error) => void
}) => {
  const stripe = useStripe()

  useEffect(() => {
    if (stripe && paymentIntentSecret) {
      onLoadingChange(true)
      stripe!
        .confirmCardPayment(paymentIntentSecret, { payment_method: paymentMethodId })
        .then((res) => {
          onPaymentIntentConfirm(res)
          onLoadingChange(false)
        })
        .catch((err) => {
          console.error(err)
          onError?.(err)
          onLoadingChange(false)
        })
    }
  }, [paymentIntentSecret, stripe])

  return <LoadingLine loading={true} />
}
