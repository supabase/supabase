import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Modal } from 'ui'

interface AddPaymentMethodFormProps {
  returnUrl: string
  onCancel: () => void
  onConfirm: () => void
}

// Stripe docs recommend to use the new SetupIntent flow over
// manually creating and attaching payment methods via the API
// Small UX annoyance here, that the page will be refreshed

const AddPaymentMethodForm = ({ returnUrl, onCancel, onConfirm }: AddPaymentMethodFormProps) => {
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
      toast.error(error?.message ?? ' Failed to save card details')
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
      <Modal.Content
        className={`transition ${isSaving ? 'pointer-events-none opacity-75' : 'opacity-100'}`}
      >
        <PaymentElement className="[.p-LinkAutofillPrompt]:pt-0" />
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex items-center space-x-2">
        <Button
          htmlType="button"
          size="small"
          type="default"
          onClick={onCancel}
          block
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          block
          htmlType="submit"
          size="small"
          type="primary"
          loading={isSaving}
          disabled={isSaving}
        >
          Add payment method
        </Button>
      </Modal.Content>
    </form>
  )
}

export default AddPaymentMethodForm
