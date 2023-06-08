import Panel from 'components/ui/Panel'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import { Button, IconCreditCard, IconFileText, Modal } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useState } from 'react'
import PaymentMethodSelection from './PaymentMethodSelection'
import { useParams } from 'common'
import {
  SubscriptionTier,
  updateSubscriptionTier,
} from 'data/subscriptions/project-subscription-update-mutation'
import { useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'

export interface SubscriptionTierProps {
  subscription: ProjectSubscriptionResponse
}

const SubscriptionPaymentMethod = ({ subscription }: SubscriptionTierProps) => {
  const { ref: projectRef } = useParams()
  const { ui } = useStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    subscription.payment_method_id || ''
  )

  const onConfirmPaymentMethod = async () => {
    setIsSubmitting(true)

    if (selectedPaymentMethod) {
      if (!projectRef) return console.error('Project ref is required')
      if (!selectedPaymentMethod) {
        return ui.setNotification({ category: 'error', message: 'Please select a payment method' })
      }

      const selectedTier =
        subscription.plan.id === 'pro' && subscription.usage_billing_enabled
          ? 'tier_payg'
          : `tier_${subscription.plan.id}`

      try {
        setIsSubmitting(true)
        await updateSubscriptionTier({
          projectRef,
          tier: selectedTier as SubscriptionTier,
          paymentMethod: selectedPaymentMethod,
        })

        setShowPaymentEditModal(false)

        ui.setNotification({
          category: 'success',
          message: `Successfully updated payment method!`,
        })
      } catch (error: any) {
        ui.setNotification({
          error,
          category: 'error',
          message: `Unable to update subscription: ${error.message}`,
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    setIsSubmitting(false)
  }

  if (subscription.payment_method_type === 'none') return null

  return (
    <>
      <Panel>
        <Panel.Content className="flex justify-between lg:items-center flex-col md:flex-row space-y-6 md:space-y-0">
          {subscription.payment_method_type === 'card' && (
            <>
              <div className="flex space-x-3 items-center font-mono tracking-wide text-scale-1000">
                {subscription.payment_method_card_details?.brand ? (
                  <img
                    alt="Credit card brand"
                    src={`${BASE_PATH}/img/payment-methods/${subscription.payment_method_card_details?.brand
                      .replace(' ', '-')
                      .toLowerCase()}.png`}
                    width="32"
                  />
                ) : (
                  <IconCreditCard />
                )}
                <span>
                  **** **** ****{' '}
                  {subscription?.payment_method_card_details?.last_4_digits || '****'}
                </span>
              </div>
              <div className="flex flex-row space-x-3 text-scale-1000">
                <span>
                  Expires {subscription?.payment_method_card_details?.expiry_month || '-'}/
                  {subscription?.payment_method_card_details?.expiry_year?.toString()?.slice(-2) ||
                    '-'}
                </span>
              </div>
            </>
          )}

          {subscription?.payment_method_type === 'invoice' && (
            <>
              <div className="flex space-x-3">
                <div >
                  <p className="text-scale-1100">Payment via invoice</p>
                  <p className="text-sm text-scale-1000">You get a monthly invoice and payment link via email.</p>
                </div>
              </div>
            </>
          )}

          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <div>
                <Button
                  type="default"
                  disabled={subscription?.payment_method_type !== 'card'}
                  onClick={() => setShowPaymentEditModal(true)}
                >
                  Change
                </Button>
              </div>
            </Tooltip.Trigger>
            {subscription?.payment_method_type !== 'card' && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
                      Please email support@supbase.io to change your payment method.
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </Panel.Content>
      </Panel>

      <Modal
        loading={isSubmitting}
        alignFooter="right"
        className="!w-[450px]"
        visible={showPaymentEditModal}
        onCancel={() => setShowPaymentEditModal(false)}
        onConfirm={onConfirmPaymentMethod}
        overlayClassName="pointer-events-none"
        header={`Change payment method`}
      >
        <Modal.Content>
          <div className="py-6 space-y-2">
            <p className="text-sm">
              Upon clicking confirm, your next and future invoices will be deducted from the
              selected payment method. There are no immediate charges.
            </p>
            <div className="!mt-6">
              <PaymentMethodSelection
                selectedPaymentMethod={selectedPaymentMethod}
                onSelectPaymentMethod={setSelectedPaymentMethod}
              />
            </div>
          </div>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default SubscriptionPaymentMethod
