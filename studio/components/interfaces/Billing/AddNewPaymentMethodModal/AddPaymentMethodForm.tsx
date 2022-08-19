import { FC, useState } from 'react'
import { Button, Modal } from '@supabase/ui'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { useStore } from 'hooks'

interface Props {
  returnUrl: string
  onCancel: () => void
}

// Stripe docs recommend to use the new SetupIntent flow over
// manually creating and attaching payment methods via the API
// Small UX annoyance here, that the page will be refreshed

const AddPaymentMethodForm: FC<Props> = ({ returnUrl, onCancel }) => {
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
      confirmParams: { return_url: returnUrl },
    })

    if (error) {
      setIsSaving(false)
      ui.setNotification({
        category: 'error',
        message: error?.message ?? ' Failed to save card details',
      })
    }

    if (document !== undefined) {
      document.body.classList.remove('!pointer-events-auto')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Content>
        <div
          className={`transition ${isSaving ? 'opacity-75 pointer-events-none' : 'opacity-100'}`}
        >
          <PaymentElement />
        </div>
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
