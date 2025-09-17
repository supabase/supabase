import { useStripe } from '@stripe/react-stripe-js'
import { PaymentIntentResult } from '@stripe/stripe-js'
import { useEffect } from 'react'
import { LoadingLine } from 'ui'

export const PaymentConfirmation = ({
  paymentIntentSecret,
  onPaymentIntentConfirm,
  onLoadingChange,
  onError,
}: {
  paymentIntentSecret: string
  onPaymentIntentConfirm: (response: PaymentIntentResult) => void
  onLoadingChange: (loading: boolean) => void
  onError?: (error: Error) => void
}) => {
  const stripe = useStripe()

  useEffect(() => {
    if (stripe && paymentIntentSecret) {
      onLoadingChange(true)
      stripe!
        .confirmCardPayment(paymentIntentSecret)
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
