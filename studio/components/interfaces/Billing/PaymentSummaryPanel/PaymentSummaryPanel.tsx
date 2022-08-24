import { FC, useState } from 'react'
import {
  Listbox,
  IconLoader,
  Button,
  IconPlus,
  IconAlertCircle,
  IconCreditCard,
  Modal,
  Alert,
} from '@supabase/ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useFlag, useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS, STRIPE_PRODUCT_IDS } from 'lib/constants'
import { SubscriptionPreview } from '../Billing.types'
import { getProductPrice } from '../Billing.utils'
import PaymentTotal from './PaymentTotal'
import InformationBox from 'components/ui/InformationBox'

interface Props {
  isRefreshingPreview: boolean
  subscriptionPreview?: SubscriptionPreview
  currentPlan: any
  currentComputeSize: any
  selectedPlan?: any
  selectedComputeSize: any
  isSpendCapEnabled: boolean
  paymentMethods?: any
  selectedPaymentMethod: any
  isLoadingPaymentMethods: boolean
  onSelectPaymentMethod: (method: any) => void
  onSelectAddNewPaymentMethod: () => void
  onConfirmPayment: () => void
  isSubmitting: boolean
}

// Use case of this panel is actually only for upgrading from Free to Pro
// OR managing Pro configuration. For simplicity, we code this component
// within this boundary

// [Joshen] Eventually if we do support more addons, it'll be better to generalize
// the selectedComputeSize to an addOns array. But for now, we keep it simple, don't over-engineer too early

const PaymentSummaryPanel: FC<Props> = ({
  isRefreshingPreview,
  subscriptionPreview,
  currentPlan,
  selectedPlan,
  isSpendCapEnabled,
  currentComputeSize,
  selectedComputeSize,
  paymentMethods,
  selectedPaymentMethod,
  isLoadingPaymentMethods,
  onSelectPaymentMethod,
  onSelectAddNewPaymentMethod,
  onConfirmPayment,
  isSubmitting,
}) => {
  const { ui } = useStore()
  const projectRegion = ui.selectedProject?.region
  const isOwner = ui.selectedOrganization?.is_owner

  const enablePermissions = useFlag('enablePermissions')
  const canUpdatePaymentMethods = enablePermissions
    ? checkPermissions(PermissionAction.BILLING_WRITE, 'stripe.payment_methods')
    : isOwner

  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const isEnterprise = currentPlan.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE
  const isChangingPlan =
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG &&
      selectedPlan &&
      currentPlan.prod_id !== selectedPlan.id) ||
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG && !isSpendCapEnabled) ||
    (currentPlan.prod_id === STRIPE_PRODUCT_IDS.PAYG && isSpendCapEnabled)
  const isChangingComputeSize = currentComputeSize.id !== selectedComputeSize.id

  // If it's enterprise we only only changing of add-ons
  const hasChangesToPlan = isEnterprise
    ? isChangingComputeSize
    : subscriptionPreview?.has_changes ?? false

  const getPlanName = (plan: any) => {
    if (plan.prod_id === STRIPE_PRODUCT_IDS.PAYG || plan.id === STRIPE_PRODUCT_IDS.PAYG) {
      return 'Pro tier (No spend caps)'
    } else return plan.name
  }

  return (
    <>
      <div
        className="bg-panel-body-light dark:bg-panel-body-dark w-full space-y-8 border-l px-6 py-10 lg:px-12"
        style={{ height: 'calc(100vh - 57px)' }}
      >
        <p>Payment Summary</p>

        {/* Subscription details */}
        <div className="space-y-1">
          <p className="text-scale-1100 text-sm">Selected subscription</p>
          <div className="flex items-center justify-between">
            <p className={`${isChangingPlan ? 'text-scale-1100 line-through' : ''} text-sm`}>
              {getPlanName(currentPlan)}
            </p>
            <p className={`${isChangingPlan ? 'text-scale-1100 line-through' : ''} text-sm`}>
              ${(currentPlan.unit_amount / 100).toFixed(2)}
            </p>
          </div>
          {isChangingPlan && (
            <div className="flex items-center justify-between">
              <p className="text-sm">{getPlanName(selectedPlan)}</p>
              <p className="text-sm">
                ${(getProductPrice(selectedPlan).unit_amount / 100).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Add on details */}
        {projectRegion !== 'af-south-1' && (
          <div className="space-y-1">
            <p className="text-sm">Selected add-ons</p>
            {currentComputeSize === undefined && selectedComputeSize === undefined && (
              <p className="text-scale-1100 text-sm">No add-ons selected</p>
            )}
            {currentComputeSize !== undefined && (
              <div className="flex items-center justify-between">
                <p
                  className={`${
                    isChangingComputeSize ? 'text-scale-1100 line-through' : ''
                  } text-sm`}
                >
                  {currentComputeSize.name}
                </p>
                <p
                  className={`${
                    isChangingComputeSize ? 'text-scale-1100 line-through' : ''
                  } text-sm`}
                >
                  ${(getProductPrice(currentComputeSize).unit_amount / 100).toFixed(2)}
                </p>
              </div>
            )}
            {isChangingComputeSize && (
              <div className="flex items-center justify-between">
                <p className="text-sm">{selectedComputeSize.name}</p>
                <p className="text-sm">
                  ${(getProductPrice(selectedComputeSize).unit_amount / 100).toFixed(2)}
                </p>
              </div>
            )}
            {isChangingComputeSize && (
              <div className="!mt-4">
                <InformationBox
                  hideCollapse
                  defaultVisibility
                  icon={<IconAlertCircle strokeWidth={2} />}
                  title="Changing your compute size"
                  description="It will take up to 2 minutes for changes to take place, and your project will be unavailable during that time"
                />
              </div>
            )}
          </div>
        )}

        <div className="bg-scale-600 h-px w-full" />

        <PaymentTotal
          subscriptionPreview={subscriptionPreview}
          isRefreshingPreview={isRefreshingPreview}
          isSpendCapEnabled={isSpendCapEnabled}
        />

        {/* Payment method selection */}
        <div className="space-y-2">
          <p className="text-sm">Select payment method</p>
          {isLoadingPaymentMethods ? (
            <div className="bg-scale-400 border-scale-700 flex items-center space-x-4 rounded-md border px-4 py-2">
              <IconLoader className="animate-spin" size={14} />
              <p className="text-scale-1100 text-sm">Retrieving payment methods</p>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="bg-scale-100 flex items-center justify-between rounded-md border border-dashed px-4 py-2">
              <div className="text-scale-1100 flex items-center space-x-4">
                <IconAlertCircle size={16} strokeWidth={1.5} />
                <p className="text-sm">No saved payment methods</p>
              </div>

              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    type="default"
                    disabled={!canUpdatePaymentMethods}
                    icon={<IconCreditCard />}
                    onClick={onSelectAddNewPaymentMethod}
                  >
                    Add new
                  </Button>
                </Tooltip.Trigger>
                {!canUpdatePaymentMethods && (
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                        'border-scale-200 w-48 border text-center', //border
                      ].join(' ')}
                    >
                      <span className="text-scale-1200 text-xs">
                        {enablePermissions
                          ? 'You need additional permissions to add new payment methods to this organization'
                          : 'Only organization owners can add new payment methods'}
                      </span>
                    </div>
                  </Tooltip.Content>
                )}
              </Tooltip.Root>
            </div>
          ) : (
            <Listbox value={selectedPaymentMethod?.id} onChange={onSelectPaymentMethod}>
              {paymentMethods.map((method: any) => {
                const label = `•••• •••• •••• ${method.card.last4}`
                return (
                  <Listbox.Option
                    key={method.id}
                    label={label}
                    value={method.id}
                    addOnBefore={() => {
                      return (
                        <img
                          src={`/img/payment-methods/${method.card.brand
                            .replace(' ', '-')
                            .toLowerCase()}.png`}
                          width="32"
                        />
                      )
                    }}
                  >
                    <div>{label}</div>
                  </Listbox.Option>
                )
              })}
              <div
                className="hover:bg-scale-500 group flex cursor-pointer items-center space-x-2 py-2 px-3 transition"
                onClick={onSelectAddNewPaymentMethod}
              >
                <IconPlus size={16} />
                <p className="text-scale-1000 group-hover:text-scale-1200 transition">
                  Add new payment method
                </p>
              </div>
            </Listbox>
          )}
        </div>

        <div className="flex items-center justify-end">
          <Button
            block
            type="primary"
            size="medium"
            loading={isSubmitting}
            disabled={isSubmitting || isLoadingPaymentMethods || !hasChangesToPlan}
            onClick={() => (isChangingComputeSize ? setShowConfirmModal(true) : onConfirmPayment())}
          >
            Confirm payment
          </Button>
        </div>
      </div>

      <Modal
        hideFooter
        visible={showConfirmModal}
        size="large"
        header="Updating project database instance size"
        onCancel={() => setShowConfirmModal(false)}
      >
        <div className="space-y-4 py-4">
          <Modal.Content>
            <Alert
              withIcon
              variant="warning"
              title="Your project will need to be restarted for changes to take place"
            >
              Upon confirmation, your project will be restarted to change your instance size. This
              will take up to 2 minutes in which your project will be unavailable during the time.
            </Alert>
          </Modal.Content>
          <Modal.Content>
            <p className="text-scale-1200 text-sm">Would you like to update your project now?</p>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="flex items-center gap-2">
              <Button block type="default" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button
                block
                type="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
                onClick={() => onConfirmPayment()}
              >
                Confirm
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default PaymentSummaryPanel
