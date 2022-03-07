import { FC } from 'react'
import { Button, Modal } from '@supabase/ui'
import { PaymentElement } from '@stripe/react-stripe-js'

interface Props {
  visible: boolean
  onCancel: () => void
}

// Add payment method: https://stripe.com/docs/payments/save-and-reuse?platform=web&html-or-react=react

const AddNewPaymentMethodModal: FC<Props> = ({ visible, onCancel }) => {
  return (
    <Modal
      hideFooter
      size="medium"
      visible={visible}
      header="Add new payment method"
      onCancel={onCancel}
      className="PAYMENT"
    >
      <div className="py-4 space-y-4">
        <Modal.Content>
          <PaymentElement />
        </Modal.Content>
        <Modal.Seperator />
        <Modal.Content>
          <div className="flex items-center gap-2">
            <Button htmlType="button" type="primary" onClick={() => {}} block>
              Save
            </Button>
            <Button htmlType="button" type="default" onClick={onCancel} block>
              Cancel
            </Button>
          </div>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default AddNewPaymentMethodModal
