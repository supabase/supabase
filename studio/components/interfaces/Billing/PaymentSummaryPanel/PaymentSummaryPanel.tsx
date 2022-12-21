import { FC, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Listbox, IconLoader, Button, IconPlus, IconAlertCircle, IconCreditCard } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS, STRIPE_PRODUCT_IDS } from 'lib/constants'
import { SubscriptionPreview } from '../Billing.types'
import { getProductPrice, validateSubscriptionUpdatePayload } from '../Billing.utils'
import PaymentTotal from './PaymentTotal'
import InformationBox from 'components/ui/InformationBox'
import { SubscriptionAddon } from '../AddOns/AddOns.types'
import { getPITRDays } from './PaymentSummaryPanel.utils'
import ConfirmPaymentModal from './ConfirmPaymentModal'
import { StripeSubscription } from '../Subscription/Subscription.types'

// [Joshen] PITR stuff can be undefined for now until we officially launch PITR self serve

interface Props {
  isRefreshingPreview: boolean
  currentSubscription?: StripeSubscription
  subscriptionPreview?: SubscriptionPreview

  currentPlan: any
  currentAddons: {
    computeSize: SubscriptionAddon
    pitrDuration: SubscriptionAddon
    customDomains: SubscriptionAddon
    supportPlan?: SubscriptionAddon
  }

  selectedPlan?: any
  selectedAddons: {
    computeSize: SubscriptionAddon
    pitrDuration: SubscriptionAddon
    customDomains: SubscriptionAddon
  }

  isSpendCapEnabled: boolean
  paymentMethods?: any
  selectedPaymentMethod: any
  isLoadingPaymentMethods: boolean
  onSelectPaymentMethod: (method: any) => void
  onSelectAddNewPaymentMethod: () => void
  beforeConfirmPayment: () => Promise<boolean>
  onConfirmPayment: () => void
  isSubmitting: boolean

  captcha: React.ReactNode
}

// Use case of this panel is actually only for upgrading from Free to Pro
// OR managing Pro configuration. For simplicity, we code this component
// within this boundary

// [Joshen] Eventually if we do support more addons, it'll be better to generalize
// the selectedComputeSize to an addOns array. But for now, we keep it simple, don't over-engineer too early

const PaymentSummaryPanel: FC<Props> = ({
  isRefreshingPreview,
  isSpendCapEnabled,
  currentSubscription,
  subscriptionPreview,

  currentPlan,
  currentAddons,

  selectedPlan,
  selectedAddons,

  paymentMethods,
  selectedPaymentMethod,
  isLoadingPaymentMethods,
  onSelectPaymentMethod,
  onSelectAddNewPaymentMethod,
  beforeConfirmPayment,
  onConfirmPayment,
  isSubmitting,
  captcha,
}) => {
  const { ui } = useStore()
  const projectRegion = ui.selectedProject?.region

  const canUpdatePaymentMethods = checkPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.payment_methods'
  )

  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const currentPITRDays =
    currentAddons.pitrDuration !== undefined ? getPITRDays(currentAddons.pitrDuration) : 0
  const selectedPITRDays =
    selectedAddons.pitrDuration !== undefined ? getPITRDays(selectedAddons.pitrDuration) : 0

  const isEnterprise = currentPlan.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE
  const isChangingPlan =
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG &&
      selectedPlan &&
      currentPlan.prod_id !== selectedPlan.id) ||
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG && !isSpendCapEnabled) ||
    (currentPlan.prod_id === STRIPE_PRODUCT_IDS.PAYG && isSpendCapEnabled)
  const isChangingComputeSize = currentAddons.computeSize.id !== selectedAddons.computeSize.id
  const isChangingPITRDuration = currentAddons.pitrDuration?.id !== selectedAddons.pitrDuration?.id
  const isChangingCustomDomains =
    currentAddons.customDomains?.id !== selectedAddons.customDomains?.id

  // If it's enterprise we only only changing of add-ons
  const hasChangesToPlan = isEnterprise
    ? isChangingComputeSize || isChangingPITRDuration
    : subscriptionPreview?.has_changes ?? false

  const getPlanName = (plan: any) => {
    if (plan.prod_id === STRIPE_PRODUCT_IDS.PAYG || plan.id === STRIPE_PRODUCT_IDS.PAYG) {
      return 'Pro tier (No spend caps)'
    } else return plan.name
  }

  const getAddonPriceFromSubscription = (
    key: 'computeSize' | 'pitrDuration' | 'customDomains' | 'supportPlan'
  ) => {
    return (
      ((currentSubscription?.addons ?? []).find((addon) => addon.prod_id === currentAddons[key]?.id)
        ?.unit_amount ?? 0) / 100
    ).toFixed(2)
  }

  const validateOrder = async () => {
    const error = validateSubscriptionUpdatePayload(selectedAddons)
    if (error) {
      return ui.setNotification({
        duration: 4000,
        category: 'error',
        message: error,
      })
    } else {
      // [Joshen] We're validating captcha before subsequent actions as there's an issue
      // with the hcaptcha overlay and the modal component, such that clicking on the hcaptcha closes
      // both the hcaptcha overlay and the modal. Need to figure that out first, then we can validate
      // the hcaptcha within onConfirmPayment()
      const hasValidCaptcha = await beforeConfirmPayment()
      if (hasValidCaptcha) {
        isChangingComputeSize || (isChangingPITRDuration && selectedPITRDays === 0)
          ? setShowConfirmModal(true)
          : onConfirmPayment()
      }
    }
  }

  return (
    <>
      <div
        className="w-full px-6 py-10 space-y-8 overflow-y-auto border-l bg-panel-body-light dark:bg-panel-body-dark lg:px-12"
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
            <p className="text-sm text-scale-1100">Selected add-ons</p>

            {/* Compute size */}
            <div className="flex items-center justify-between">
              <p
                className={`${isChangingComputeSize ? 'text-scale-1100 line-through' : ''} text-sm`}
              >
                {currentAddons.computeSize.name}
              </p>
              <p
                className={`${isChangingComputeSize ? 'text-scale-1100 line-through' : ''} text-sm`}
              >
                ${getAddonPriceFromSubscription('computeSize')}
              </p>
            </div>
            {isChangingComputeSize && (
              <div className="flex items-center justify-between">
                <p className="text-sm">{selectedAddons.computeSize.name}</p>
                <p className="text-sm">
                  ${(getProductPrice(selectedAddons.computeSize).unit_amount / 100).toFixed(2)}
                </p>
              </div>
            )}

            {/* PITR Duration */}
            {currentAddons.pitrDuration?.id !== undefined && (
              <div className="flex items-center justify-between">
                <p
                  className={`${
                    isChangingPITRDuration ? 'text-scale-1100 line-through' : ''
                  } text-sm`}
                >
                  {currentAddons.pitrDuration?.name}
                </p>
                <p
                  className={`${
                    isChangingPITRDuration ? 'text-scale-1100 line-through' : ''
                  } text-sm`}
                >
                  ${getAddonPriceFromSubscription('pitrDuration')}
                </p>
              </div>
            )}
            {isChangingPITRDuration && (
              <div className="flex items-center justify-between">
                <p className="text-sm">{selectedAddons.pitrDuration?.name}</p>
                <p className="text-sm">
                  ${(getProductPrice(selectedAddons.pitrDuration).unit_amount / 100).toFixed(2)}
                </p>
              </div>
            )}

            {/* Custom Domains */}
            {currentAddons.customDomains?.id !== undefined && (
              <div className="flex items-center justify-between">
                <p
                  className={`${
                    isChangingCustomDomains ? 'text-scale-1100 line-through' : ''
                  } text-sm`}
                >
                  {currentAddons.customDomains?.name}
                </p>
                <p
                  className={`${
                    isChangingCustomDomains ? 'text-scale-1100 line-through' : ''
                  } text-sm`}
                >
                  ${getAddonPriceFromSubscription('customDomains')}
                </p>
              </div>
            )}
            {isChangingCustomDomains && (
              <div className="flex items-center justify-between">
                <p className="text-sm">{selectedAddons.customDomains?.name}</p>
                <p className="text-sm">
                  ${(getProductPrice(selectedAddons.customDomains).unit_amount / 100).toFixed(2)}
                </p>
              </div>
            )}

            {/* Support Plan */}
            {currentAddons.supportPlan !== undefined && (
              <div className="flex items-center justify-between">
                <p className="text-sm">{currentAddons.supportPlan?.name}</p>
                <p className="text-sm">${getAddonPriceFromSubscription('supportPlan')}</p>
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
                    currentAddons.pitrDuration?.id === undefined
                      ? 'Enabling PITR'
                      : selectedAddons.pitrDuration?.id === undefined
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

        <div className="w-full h-px bg-scale-600" />

        <PaymentTotal
          subscriptionPreview={subscriptionPreview}
          isRefreshingPreview={isRefreshingPreview}
          isSpendCapEnabled={isSpendCapEnabled}
        />

        {/* Payment method selection */}
        <div className="space-y-2">
          <p className="text-sm">Select payment method</p>
          {isLoadingPaymentMethods ? (
            <div className="flex items-center px-4 py-2 space-x-4 border rounded-md border-scale-700 bg-scale-400">
              <IconLoader className="animate-spin" size={14} />
              <p className="text-sm text-scale-1100">Retrieving payment methods</p>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="flex items-center justify-between px-4 py-2 border border-dashed rounded-md bg-scale-100">
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
                        You need additional permissions to add new payment methods to this
                        organization
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
                className="flex items-center px-3 py-2 space-x-2 transition cursor-pointer group hover:bg-scale-500"
                onClick={onSelectAddNewPaymentMethod}
              >
                <IconPlus size={16} />
                <p className="transition text-scale-1000 group-hover:text-scale-1200">
                  Add new payment method
                </p>
              </div>
            </Listbox>
          )}
        </div>

        <div className="self-center">{captcha}</div>

        <div className="flex items-center justify-end">
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="w-full">
              <Button
                block
                type="primary"
                size="medium"
                loading={isSubmitting}
                disabled={
                  isSubmitting ||
                  isLoadingPaymentMethods ||
                  !hasChangesToPlan ||
                  !selectedPaymentMethod
                }
                onClick={() => validateOrder()}
              >
                Confirm payment
              </Button>
            </Tooltip.Trigger>
            {!hasChangesToPlan ? (
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">
                    No changes made to your subscription
                  </span>
                </div>
              </Tooltip.Content>
            ) : !selectedPaymentMethod ? (
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">Please select a payment method</span>
                </div>
              </Tooltip.Content>
            ) : (
              <></>
            )}
          </Tooltip.Root>
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
