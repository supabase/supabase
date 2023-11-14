import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'
import { Button, Modal } from 'ui'

import { useStore } from 'hooks'

interface AddPaymentMethodFormProps {
  returnUrl: string
  onCancel: () => void
  onConfirm: () => void
}

// Stripe docs recommend to use the new SetupIntent flow over
// manually creating and attaching payment methods via the API
// Small UX annoyance here, that the page will be refreshed

const AddPaymentMethodForm = ({ returnUrl, onCancel, onConfirm }: AddPaymentMethodFormProps) => {
  const { ui } = useStore()
  const stripe = useStripe()
  const elements = useElements()

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: any) => {
    event.preventDefault()

    if (!stripe || !elements) {
      console.error('Stripe.js has not loaded')
      return
    }

    setIsSaving(true)

    if (document !== undefined) {
      // [Joshen] This is to ensure that any 3DS popup from Stripe remains clickable
      document.body.classList.add('!pointer-events-auto')
    }

    const { error } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: returnUrl },
    })

    if (error) {
      setIsSaving(false)
      ui.setNotification({
        category: 'error',
        message: error?.message ?? ' Failed to save card details',
      })
    } else {
      setIsSaving(false)
      onConfirm()
    }

    if (document !== undefined) {
      document.body.classList.remove('!pointer-events-auto')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Content>
        <div
          className={`transition ${isSaving ? 'pointer-events-none opacity-75' : 'opacity-100'}`}
        >
          <PaymentElement />
        </div>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content>
        <div className="flex items-center space-x-2 pt-2">
          <Button block htmlType="submit" type="primary" loading={isSaving} disabled={isSaving}>
            Save
          </Button>
          <Button htmlType="button" type="default" onClick={onCancel} block disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </Modal.Content>
    </form>
  )
}

export default AddPaymentMethodForm
