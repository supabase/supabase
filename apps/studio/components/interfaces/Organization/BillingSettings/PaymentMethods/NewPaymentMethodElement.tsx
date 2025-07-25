/**
 * Set up as a separate component, as we need any component using stripe/elements to be wrapped in Elements.
 *
 * If Elements is on a higher level, we risk losing all form state in case a payment fails.
 */

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { forwardRef, useImperativeHandle } from 'react'
import { toast } from 'sonner'

const NewPaymentMethodElement = forwardRef(
  (
    {
      email,
      readOnly,
    }: {
      email?: string | null | undefined
      readOnly: boolean
    },
    ref
  ) => {
    const stripe = useStripe()
    const elements = useElements()

    const createPaymentMethod = async () => {
      if (!stripe || !elements) return
      await elements.submit()

      // To avoid double 3DS confirmation, we just create the payment method here, as there might be a confirmation step while doing the actual payment
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      })
      if (error || paymentMethod == null) {
        toast.error(error?.message ?? ' Failed to process card details')
        return
      }
      return paymentMethod
    }

    useImperativeHandle(ref, () => ({
      createPaymentMethod,
    }))

    return (
      <PaymentElement
        options={{ defaultValues: { billingDetails: { email: email ?? undefined } }, readOnly }}
      />
    )
  }
)

NewPaymentMethodElement.displayName = 'NewPaymentMethodElement'

export { NewPaymentMethodElement }
