import { FC, useState } from 'react'
import { Button, Modal } from '@supabase/ui'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'

interface Props {
  returnUrl: string
  onCancel: () => void
}

// Stripe docs recommend to use the new SetupIntent flow over
// manually creating and attaching payment methods via the API
// Small UX annoyance here, that the page will be refreshed

const AddPaymentMethodForm: FC<Props> = ({ returnUrl, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: any) => {
    event.preventDefault()
    setIsSaving(true)

    if (!stripe || !elements) {
      console.error('Stripe.js has not loaded')
      return
    }

    await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: returnUrl },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Content>
        <PaymentElement />
      </Modal.Content>
      <Modal.Seperator />
      <Modal.Content>
        <div className="flex items-center space-x-2 pt-2">
          <Button block htmlType="submit" type="primary" loading={isSaving}>
            Save
          </Button>
          <Button htmlType="button" type="default" onClick={onCancel} block>
            Cancel
          </Button>
        </div>
      </Modal.Content>
    </form>
  )
}

export default AddPaymentMethodForm
