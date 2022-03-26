import { FC } from 'react'
import { Listbox, IconLoader, Button, IconPlus, IconAlertCircle } from '@supabase/ui'

import { useStore } from 'hooks'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
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

  const isChangingPlan =
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG && currentPlan.prod_id !== selectedPlan?.id) ||
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG && !isSpendCapEnabled) ||
    (currentPlan.prod_id === STRIPE_PRODUCT_IDS.PAYG && isSpendCapEnabled)
  const isChangingComputeSize = currentComputeSize.id !== selectedComputeSize.id
  const hasChangesToPlan = subscriptionPreview?.has_changes ?? false

  const getPlanName = (plan: any) => {
    if (plan.prod_id === STRIPE_PRODUCT_IDS.PAYG || plan.id === STRIPE_PRODUCT_IDS.PAYG) {
      return 'Pro tier (No spend caps)'
    } else return plan.name
  }

  return (
    <div
      className="bg-scale-300 w-full px-20 py-10 space-y-8"
      style={{ height: 'calc(100vh - 49.5px)' }}
    >
      <p>Payment Summary</p>

      {/* Subscription details */}
      <div className="space-y-1">
        <p className="text-sm">Selected subscription</p>
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
          <div className="flex items-center rounded-md space-x-4 px-4 py-2 bg-scale-400 border border-scale-700">
            <IconLoader className="animate-spin" size={14} />
            <p className="text-sm text-scale-1100">Retrieving payment methods</p>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="flex items-center justify-between rounded-md px-4 py-2 bg-scale-400 border border-scale-700">
            <div className="flex items-center space-x-4">
              <IconAlertCircle size={16} />
              <p className="text-scale-1100 text-sm">No saved payment methods</p>
            </div>
            <Button type="default" icon={<IconPlus />} onClick={onSelectAddNewPaymentMethod}>
              Add new
            </Button>
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
              className="py-2 px-3 flex items-center space-x-2 cursor-pointer transition group hover:bg-scale-500"
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
          type="primary"
          loading={isSubmitting}
          disabled={isSubmitting || isLoadingPaymentMethods || !hasChangesToPlan}
          onClick={() => onConfirmPayment()}
        >
          Confirm payment
        </Button>
      </div>
    </div>
  )
}

export default PaymentSummaryPanel
