import { toast } from 'sonner'

import { useParams } from 'common'
import { useOrganizationPaymentMethodMarkAsDefaultMutation } from 'data/organizations/organization-payment-method-default-mutation'
import type { OrganizationPaymentMethod } from 'data/organizations/organization-payment-methods-query'
import { Button, Modal } from 'ui'

export interface ChangePaymentMethodModalProps {
  selectedPaymentMethod?: OrganizationPaymentMethod
  onClose: () => void
}

const ChangePaymentMethodModal = ({
  selectedPaymentMethod,
  onClose,
}: ChangePaymentMethodModalProps) => {
  const { slug } = useParams()
  const { mutate: markAsDefault, isLoading: isUpdating } =
    useOrganizationPaymentMethodMarkAsDefaultMutation({
      onSuccess: () => {
        toast.success(
          `Successfully changed payment method to the card ending with ${
            selectedPaymentMethod!.card!.last4
          }`
        )
        onClose()
      },
      onError: (error) => {
        toast.error(`Failed to change payment method: ${error.message}`)
      },
    })

  const onConfirmUpdate = async () => {
    if (!slug) return console.error('Slug is required')
    if (!selectedPaymentMethod) return console.error('Card ID is required')

    markAsDefault({
      slug,
      paymentMethodId: selectedPaymentMethod.id,
    })
  }

  return (
    <Modal
      visible={selectedPaymentMethod !== undefined}
      size="medium"
      header={`Confirm to use payment method ending with ${selectedPaymentMethod?.card?.last4}`}
      onCancel={() => onClose()}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" disabled={isUpdating} onClick={() => onClose()}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={isUpdating}
            loading={isUpdating}
            onClick={onConfirmUpdate}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <Modal.Content>
        <p className="text-sm">
          Upon clicking confirm, all future charges will be deducted from the card ending with{' '}
          {selectedPaymentMethod?.card?.last4}. There are no immediate charges.
        </p>
      </Modal.Content>
    </Modal>
  )
}

export default ChangePaymentMethodModal
