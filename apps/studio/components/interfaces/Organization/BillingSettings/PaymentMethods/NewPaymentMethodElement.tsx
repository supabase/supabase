/**
 * Set up as a separate component, as we need any component using stripe/elements to be wrapped in Elements.
 *
 * If Elements is on a higher level, we risk losing all form state in case a payment fails.
 */

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { PaymentMethod } from '@stripe/stripe-js'
import { getURL } from 'lib/helpers'
import { forwardRef, useImperativeHandle } from 'react'
import { toast } from 'sonner'

const NewPaymentMethodElement = forwardRef(
  (
    {
      pending_subscription_flow_enabled,
      email,
      readOnly,
    }: {
      pending_subscription_flow_enabled: boolean
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

      if (pending_subscription_flow_enabled) {
        // To avoid double 3DS confirmation, we just create the payment method here, as there might be a confirmation step while doing the actual payment
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          elements,
        })
        if (error || paymentMethod == null) {
          toast.error(error?.message ?? ' Failed to process card details')
          return
        }
        return paymentMethod
      } else {
        const { error, setupIntent } = await stripe.confirmSetup({
          elements,
          redirect: 'if_required',
          confirmParams: {
            return_url: getURL(),
            expand: ['payment_method'],
          },
        })

        if (error || !setupIntent.payment_method) {
          toast.error(error?.message ?? ' Failed to save card details')
          return
        }

        return setupIntent.payment_method as PaymentMethod
      }
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
