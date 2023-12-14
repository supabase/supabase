import { useParams } from 'common'
import { useOrganizationPaymentMethodDeleteMutation } from 'data/organizations/organization-payment-method-delete-mutation'
import { OrganizationPaymentMethod } from 'data/organizations/organization-payment-methods-query'
import { useStore } from 'hooks'
import { Alert, Button, Modal } from 'ui'

export interface DeletePaymentMethodModalProps {
  selectedPaymentMethod?: OrganizationPaymentMethod
  onClose: () => void
}

const DeletePaymentMethodModal = ({
  selectedPaymentMethod,
  onClose,
}: DeletePaymentMethodModalProps) => {
  const { ui } = useStore()
  const { slug } = useParams()

  const { mutate: deletePayment, isLoading: isDeleting } =
    useOrganizationPaymentMethodDeleteMutation({
      onSuccess: () => {
        ui.setNotification({
          category: 'success',
          message: `Successfully removed payment method ending with ${
            selectedPaymentMethod!.card.last4
          }`,
        })
        onClose()
      },
    })

  const onConfirmDelete = async () => {
    if (!slug) return console.error('Slug is required')
    if (!selectedPaymentMethod) return console.error('Card ID is required')
    deletePayment({ slug, cardId: selectedPaymentMethod.id })
  }

  return (
    <Modal
      visible={selectedPaymentMethod !== undefined}
      size="medium"
      header={`Confirm to delete payment method ending with ${selectedPaymentMethod?.card.last4}`}
      onCancel={() => onClose()}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" disabled={isDeleting} onClick={() => onClose()}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={isDeleting}
            loading={isDeleting}
            onClick={onConfirmDelete}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <div className="py-4">
        <Modal.Content>
          <Alert withIcon variant="info" title="This will permanently delete your payment method.">
            <p>You can re-add the payment method any time.</p>
          </Alert>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default DeletePaymentMethodModal
