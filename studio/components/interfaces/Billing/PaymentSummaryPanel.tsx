import { FC } from 'react'
import { Listbox, IconLoader, Button, IconPlus } from '@supabase/ui'

import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { StripeProduct } from '.'
import { BillingPlan } from './PlanSelection/Plans/Plans.types'

interface Props {
  currentPlan: StripeProduct
  currentComputeSize: any
  selectedPlan?: BillingPlan
  selectedComputeSize: any
  isOverageEnabled: boolean
  paymentMethods?: any
  selectedPaymentMethod: any
  isLoadingPaymentMethods: boolean
  onSelectPaymentMethod: (method: any) => void
  onSelectAddNewPaymentMethod: () => void
  onConfirmPayment: () => void
}

// Use case of this panel is actually only for upgrading from Free to Pro
// OR managing Pro configuration. For simplicity, we code this component
// within this boundary

// [Joshen] Eventually if we do support more addons, it'll be better to generalize
// the selectedComputeSize to an addOns array. But for now, we keep it simple, don't over-engineer too early

const PaymentSummaryPanel: FC<Props> = ({
  currentPlan,
  selectedPlan,
  isOverageEnabled,
  currentComputeSize,
  selectedComputeSize,
  paymentMethods,
  selectedPaymentMethod,
  isLoadingPaymentMethods,
  onSelectPaymentMethod,
  onSelectAddNewPaymentMethod,
  onConfirmPayment,
}) => {
  const isChangingPlan =
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG && currentPlan.prod_id !== selectedPlan?.id) ||
    (currentPlan.prod_id !== STRIPE_PRODUCT_IDS.PAYG && isOverageEnabled) ||
    (currentPlan.prod_id === STRIPE_PRODUCT_IDS.PAYG && !isOverageEnabled)
  const isChangingComputeSize = currentComputeSize.id !== selectedComputeSize.id
  const hasChangesToPlan = isChangingPlan || isChangingComputeSize
  const totalMonthlyCost = (selectedPlan?.price ?? 0) + selectedComputeSize.price

  const getCurrentPlanName = () => {
    if (currentPlan.prod_id === STRIPE_PRODUCT_IDS.PAYG) return 'Pro tier (Overages enabled)'
    else return currentPlan.name
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
            {getCurrentPlanName()}
          </p>
          <p className={`${isChangingPlan ? 'text-scale-1100 line-through' : ''} text-sm`}>
            ${currentPlan.unit_amount / 100}
          </p>
        </div>
        {isChangingPlan && (
          <div className="flex items-center justify-between">
            <p className="text-sm">
              {selectedPlan?.name} tier {isOverageEnabled ? '(Overages enabled)' : ''}
            </p>
            <p className="text-sm">${selectedPlan?.price}</p>
          </div>
        )}
      </div>

      {/* Add on details */}
      <div className="space-y-1">
        <p className="text-sm">Selected add-ons</p>
        {currentComputeSize === undefined && selectedComputeSize === undefined && (
          <p className="text-scale-1100 text-sm">No add-ons selected</p>
        )}
        {currentComputeSize !== undefined && (
          <div className="flex items-center justify-between">
            <p className={`${isChangingComputeSize ? 'text-scale-1100 line-through' : ''} text-sm`}>
              Optimized database instance ({currentComputeSize.name})
            </p>
            <p className={`${isChangingComputeSize ? 'text-scale-1100 line-through' : ''} text-sm`}>
              ${currentComputeSize.price}
            </p>
          </div>
        )}
        {isChangingComputeSize && (
          <div className="flex items-center justify-between">
            <p className="text-sm">Optimized database instance ({selectedComputeSize.name})</p>
            <p className="text-sm">${selectedComputeSize.price}</p>
          </div>
        )}
      </div>

      <div className="h-px w-full bg-scale-600"></div>

      {/* Payment total */}
      <div className="flex items-start justify-between space-x-32">
        <div className="space-y-1">
          <p>Amount due today</p>
          {hasChangesToPlan && (
            <p className="text-sm text-scale-1100">
              You'll pay a monthly total of{' '}
              <span className="text-scale-1200">
                ${totalMonthlyCost} {isOverageEnabled && '+ usage fees '}
              </span>
              starting on 1st February 2022
            </p>
          )}
        </div>
        <div className="flex justify-end items-end relative -top-[5px]">
          <p className="text-scale-1100 relative -top-[1px]">$</p>
          <p className="text-2xl">0</p>
        </div>
      </div>

      {/* Payment method selection */}
      <div className="space-y-2">
        <p>Select payment method</p>
        {isLoadingPaymentMethods ? (
          <div className="flex items-center rounded-md space-x-4 px-4 py-2 bg-scale-400 border border-scale-700">
            <IconLoader className="animate-spin" size={14} />
            <p className="text-sm text-scale-1100">Retrieving payment methods</p>
          </div>
        ) : paymentMethods.length === 0 ? (
          // [TODO] We need some UI to allow users to add payment methods here
          <div className="flex items-center rounded-md space-x-4 px-4 py-2 bg-scale-400 border border-scale-700">
            <div className="text-scale-1100">No methods</div>
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
        <Button type="primary" disabled={!hasChangesToPlan} onClick={() => onConfirmPayment()}>
          Confirm payment
        </Button>
      </div>
    </div>
  )
}

export default PaymentSummaryPanel
