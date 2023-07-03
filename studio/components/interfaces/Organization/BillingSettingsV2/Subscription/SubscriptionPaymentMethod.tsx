import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import {
  SubscriptionTier,
  updateSubscriptionTier,
} from 'data/subscriptions/project-subscription-update-mutation'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import Link from 'next/link'
import { Button, IconCreditCard, Modal } from 'ui'
import PaymentMethodSelection from './PaymentMethodSelection'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'

export interface SubscriptionTierProps {
  subscription: ProjectSubscriptionResponse
}

const SubscriptionPaymentMethod = ({ subscription }: SubscriptionTierProps) => {
  const { ui } = useStore()
  const { slug } = useParams()

  const selectedOrganization = useSelectedOrganization()
  const currentOrgSlug = selectedOrganization?.slug

  const { mutateAsync: updateOrgSubscription } = useOrgSubscriptionUpdateMutation()

  const canUpdatePaymentMethod = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    subscription.payment_method_id || ''
  )

  const onConfirmPaymentMethod = async () => {
    setIsSubmitting(true)

    if (selectedPaymentMethod) {
      if (!slug) return console.error('Slug is required')
      if (!selectedPaymentMethod) {
        return ui.setNotification({ category: 'error', message: 'Please select a payment method' })
      }

      const selectedTier =
        subscription.plan.id === 'pro' && subscription.usage_billing_enabled
          ? 'tier_payg'
          : `tier_${subscription.plan.id}`

      try {
        setIsSubmitting(true)
        await updateOrgSubscription({
          slug,
          tier: selectedTier as SubscriptionTier,
          paymentMethod: selectedPaymentMethod,
        })
        setShowPaymentEditModal(false)
        ui.setNotification({ category: 'success', message: `Successfully updated payment method!` })
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
                    width="24"
                  />
                ) : (
                  <IconCreditCard />
                )}
                <span className="text-sm">
                  **** **** ****{' '}
                  {subscription?.payment_method_card_details?.last_4_digits || '****'}
                </span>
              </div>
              <div className="flex flex-row space-x-3 text-scale-1000 text-sm">
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
                <div>
                  <p className="text-scale-1100">Payment via invoice</p>
                  <p className="text-sm text-scale-1000">
                    You get a monthly invoice and payment link via email.
                  </p>
                </div>
              </div>
            </>
          )}

          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <div>
                <Button
                  type="default"
                  disabled={subscription?.payment_method_type !== 'card' || !canUpdatePaymentMethod}
                  onClick={() => setShowPaymentEditModal(true)}
                >
                  Change
                </Button>
              </div>
            </Tooltip.Trigger>
            {subscription?.payment_method_type !== 'card' ? (
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
            ) : !canUpdatePaymentMethod ? (
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
                      You do not have permission to change the payment method
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            ) : null}
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
              Upon clicking confirm, all future charges will be deducted from the selected payment
              method. There are no immediate charges. Changing the payment method for this project
              does not affect the payment method for other projects.
            </p>
            <p className="text-sm text-scale-1000">
              To remove unused or expired payment methods, head to your{' '}
              <Link href={`/org/${currentOrgSlug || '_'}/billing`} passHref>
                <a target="_blank" className="text-green-900 transition hover:text-green-1000">
                  organization's billing settings
                </a>
              </Link>
              .
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
