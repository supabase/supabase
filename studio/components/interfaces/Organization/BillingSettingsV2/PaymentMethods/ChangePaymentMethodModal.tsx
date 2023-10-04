import { useParams } from 'common'
import { OrganizationPaymentMethod } from 'data/organizations/organization-payment-methods-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { SubscriptionTier } from 'data/subscriptions/types'
import { useStore } from 'hooks'
import { Button, Modal } from 'ui'

export interface ChangePaymentMethodModalProps {
  selectedPaymentMethod?: OrganizationPaymentMethod
  onClose: () => void
}

const ChangePaymentMethodModal = ({
  selectedPaymentMethod,
  onClose,
}: ChangePaymentMethodModalProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })
  const { mutate: updateOrgSubscription, isLoading: isUpdating } = useOrgSubscriptionUpdateMutation(
    {
      onSuccess: () => {
        ui.setNotification({
          category: 'success',
          message: `Successfully changed payment method to the card ending with ${
            selectedPaymentMethod!.card.last4
          }`,
        })
        onClose()
      },
      onError: (error) => {
        ui.setNotification({
          category: 'error',
          message: `Failed to change payment method: ${error.message}`,
        })
      },
    }
  )

  const onConfirmUpdate = async () => {
    if (!slug) return console.error('Slug is required')
    if (!subscription) return console.error('Subscription is required')
    if (!selectedPaymentMethod) return console.error('Card ID is required')

    const selectedTier =
      subscription.plan.id === 'pro' && subscription.usage_billing_enabled
        ? 'tier_payg'
        : `tier_${subscription.plan.id}`

    updateOrgSubscription({
      slug,
      tier: selectedTier as SubscriptionTier,
      paymentMethod: selectedPaymentMethod.id,
    })
  }

  return (
    <Modal
      visible={selectedPaymentMethod !== undefined}
      size="medium"
      header={`Confirm to use payment method ending with ${selectedPaymentMethod?.card.last4}`}
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
      <div className="py-4">
        <Modal.Content>
          <p className="text-sm">
            Upon clicking confirm, all future charges will be deducted from the card ending with{' '}
            {selectedPaymentMethod?.card.last4}. There are no immediate charges.
          </p>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default ChangePaymentMethodModal
