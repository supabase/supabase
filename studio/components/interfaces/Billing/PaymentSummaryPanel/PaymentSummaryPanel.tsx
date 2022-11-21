import { FC, useState } from 'react'
import { Listbox, IconLoader, Button, IconPlus, IconAlertCircle, IconCreditCard } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useFlag, useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS, STRIPE_PRODUCT_IDS } from 'lib/constants'
import { SubscriptionPreview } from '../Billing.types'
import { getProductPrice, validateSubscriptionUpdatePayload } from '../Billing.utils'
import PaymentTotal from './PaymentTotal'
import InformationBox from 'components/ui/InformationBox'
import { DatabaseAddon } from '../AddOns/AddOns.types'
import { getPITRDays } from './PaymentSummaryPanel.utils'
import ConfirmPaymentModal from './ConfirmPaymentModal'

// [Joshen] PITR stuff can be undefined for now until we officially launch PITR self serve

interface Props {
  isRefreshingPreview: boolean
  subscriptionPreview?: SubscriptionPreview
  currentPlan: any
  currentComputeSize: DatabaseAddon
  currentPITRDuration: DatabaseAddon | undefined
  selectedPlan?: any
  selectedComputeSize: DatabaseAddon
  selectedPITRDuration: DatabaseAddon | undefined
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
  isSpendCapEnabled,
  subscriptionPreview,
  currentPlan,
  currentComputeSize,
  currentPITRDuration,
  selectedPlan,
  selectedComputeSize,
  selectedPITRDuration,
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

  const currentPITRDays = currentPITRDuration !== undefined ? getPITRDays(currentPITRDuration) : 0
  const selectedPITRDays =
    selectedPITRDuration !== undefined ? getPITRDays(selectedPITRDuration) : 0

  const isEnterprise = currentPlan.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE
  const isChangingPlan =
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG &&
      selectedPlan &&
      currentPlan.prod_id !== selectedPlan.id) ||
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG && !isSpendCapEnabled) ||
    (currentPlan.prod_id === STRIPE_PRODUCT_IDS.PAYG && isSpendCapEnabled)
  const isChangingComputeSize = currentComputeSize.id !== selectedComputeSize.id
  const isChangingPITRDuration = currentPITRDuration?.id !== selectedPITRDuration?.id

  // If it's enterprise we only only changing of add-ons
  const hasChangesToPlan = isEnterprise
    ? isChangingComputeSize || isChangingPITRDuration
    : subscriptionPreview?.has_changes ?? false

  const getPlanName = (plan: any) => {
    if (plan.prod_id === STRIPE_PRODUCT_IDS.PAYG || plan.id === STRIPE_PRODUCT_IDS.PAYG) {
      return 'Pro tier (No spend caps)'
    } else return plan.name
  }

  const validateOrder = () => {
    const error = validateSubscriptionUpdatePayload(selectedComputeSize, selectedPITRDuration)
    if (error) {
      return ui.setNotification({
        duration: 4000,
        category: 'error',
        message: error,
      })
    } else {
      isChangingComputeSize || (isChangingPITRDuration && selectedPITRDays === 0)
        ? setShowConfirmModal(true)
        : onConfirmPayment()
    }
  }

  return (
    <>
      <div
        className="w-full space-y-8 border-l bg-panel-body-light px-6 py-10 dark:bg-panel-body-dark lg:px-12 overflow-y-auto"
        style={{ height: 'calc(100vh - 57px)' }}
      >
        <p>Payment Summary</p>

        {/* Subscription details */}
        <div className="space-y-1">
          <p className="text-sm text-scale-1100">Selected subscription</p>
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
            <div className="flex items-center justify-between">
              <p
                className={`${isChangingComputeSize ? 'text-scale-1100 line-through' : ''} text-sm`}
              >
                {currentComputeSize.name}
              </p>
              <p
                className={`${isChangingComputeSize ? 'text-scale-1100 line-through' : ''} text-sm`}
              >
                ${(getProductPrice(currentComputeSize).unit_amount / 100).toFixed(2)}
              </p>
            </div>
            {isChangingComputeSize && (
              <div className="flex items-center justify-between">
                <p className="text-sm">{selectedComputeSize.name}</p>
                <p className="text-sm">
                  ${(getProductPrice(selectedComputeSize).unit_amount / 100).toFixed(2)}
                </p>
              </div>
            )}
            {currentPITRDuration?.id !== undefined && (
              <div className="flex items-center justify-between">
                <p
                  className={`${
                    isChangingPITRDuration ? 'text-scale-1100 line-through' : ''
                  } text-sm`}
                >
                  {currentPITRDuration?.name}
                </p>
                <p
                  className={`${
                    isChangingPITRDuration ? 'text-scale-1100 line-through' : ''
                  } text-sm`}
                >
                  ${(getProductPrice(currentPITRDuration).unit_amount / 100).toFixed(2)}
                </p>
              </div>
            )}
            {isChangingPITRDuration && (
              <div className="flex items-center justify-between">
                <p className="text-sm">{selectedPITRDuration?.name}</p>
                <p className="text-sm">
                  ${(getProductPrice(selectedPITRDuration).unit_amount / 100).toFixed(2)}
                </p>
              </div>
            )}

            {/* Show information boxes with regards to change in subscriptions */}
            <div className="!mt-4 space-y-4">
              {isChangingPITRDuration && (
                <InformationBox
                  hideCollapse
                  defaultVisibility
                  icon={<IconAlertCircle strokeWidth={2} />}
                  title={
                    currentPITRDuration?.id === undefined
                      ? 'Enabling PITR'
                      : selectedPITRDuration?.id === undefined
                      ? 'Disabling PITR'
                      : 'Updating PITR duration'
                  }
                  description={
                    selectedPITRDays >= currentPITRDays
                      ? `The days for which PITR is available for will only start at the time of enabling the add-on (e.g You will have access to the full ${selectedPITRDays} days of PITR after ${
                          selectedPITRDays - currentPITRDays
                        } days from today)`
                      : selectedPITRDays === 0
                      ? 'All available PITR back ups for your project will be removed and are non-recoverable'
                      : `Only the latest ${selectedPITRDays} days of PITR from today will be retained (all backups that are later than ${selectedPITRDays} days will be removed and are non-recoverable)`
                  }
                />
              )}
              {isChangingComputeSize && (
                <InformationBox
                  hideCollapse
                  defaultVisibility
                  icon={<IconAlertCircle strokeWidth={2} />}
                  title="Changing your compute size"
                  description="It will take up to 2 minutes for changes to take place, and your project will be unavailable during that time"
                />
              )}
            </div>
          </div>
        )}

        <div className="h-px w-full bg-scale-600" />

        <PaymentTotal
          subscriptionPreview={subscriptionPreview}
          isRefreshingPreview={isRefreshingPreview}
          isSpendCapEnabled={isSpendCapEnabled}
        />

        {/* Payment method selection */}
        <div className="space-y-2">
          <p className="text-sm">Select payment method</p>
          {isLoadingPaymentMethods ? (
            <div className="flex items-center space-x-4 rounded-md border border-scale-700 bg-scale-400 px-4 py-2">
              <IconLoader className="animate-spin" size={14} />
              <p className="text-sm text-scale-1100">Retrieving payment methods</p>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="flex items-center justify-between rounded-md border border-dashed bg-scale-100 px-4 py-2">
              <div className="flex items-center space-x-4 text-scale-1100">
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
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                        'w-48 border border-scale-200 text-center', //border
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">
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
                className="group flex cursor-pointer items-center space-x-2 py-2 px-3 transition hover:bg-scale-500"
                onClick={onSelectAddNewPaymentMethod}
              >
                <IconPlus size={16} />
                <p className="text-scale-1000 transition group-hover:text-scale-1200">
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
            onClick={() => validateOrder()}
          >
            Confirm payment
          </Button>
        </div>
      </div>

      <ConfirmPaymentModal
        visible={showConfirmModal}
        isChangingInstanceSize={isChangingComputeSize}
        isDisablingPITR={isChangingPITRDuration && selectedPITRDays === 0}
        isSubmitting={isSubmitting}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => onConfirmPayment()}
      />
    </>
  )
}

export default PaymentSummaryPanel
