import { FC } from 'react'
import { Listbox, IconLoader } from '@supabase/ui'

import { StripeSubscription } from '.'
import { BillingPlan } from './PlanSelection/Plans/Plans.types'

interface Props {
  currentPlan: StripeSubscription
  currentComputeSize?: any
  selectedPlan?: BillingPlan
  selectedComputeSize: any
  isOverageEnabled: boolean
  paymentMethods?: any
  selectedPaymentMethod: any
  isLoadingPaymentMethods: boolean
  onSelectPaymentMethod: (method: any) => void
}

// Use case of this panel is actually only for upgrading from Free to Pro
// OR managing Pro configuration. For simplicity, we code this component
// within this boundary

// [Joshen] Eventually if we do support more addons, it'll be better to generalize
// the selectedComputeSize to an addOns array. But for now, we keep it simple

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
}) => {
  const isChangingPlan = selectedPlan !== undefined
  const totalMonthlyCost = (selectedPlan?.price ?? 0) + selectedComputeSize.price

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
            {currentPlan.tier.name}
          </p>
          <p className={`${isChangingPlan ? 'text-scale-1100 line-through' : ''} text-sm`}>
            ${currentPlan.tier.unit_amount}
          </p>
        </div>
        {isChangingPlan && (
          <div className="flex items-center justify-between">
            <p className="text-sm">
              {selectedPlan?.name} {isOverageEnabled ? '(Overages enabled)' : ''}
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
        {selectedComputeSize !== undefined && (
          <div className="flex items-center justify-between">
            <p className="text-sm">Optimized database instance ({selectedComputeSize.name})</p>
            <p className="text-sm">${selectedComputeSize.price}</p>
          </div>
        )}
      </div>

      <div className="h-px w-full bg-scale-600"></div>

      {/* Payment total */}
      <div className="flex items-start justify-between space-x-16">
        <div className="space-y-1">
          <p>Amount due immediately</p>
          <p className="text-sm text-scale-1100">
            Your next invoice of ${totalMonthlyCost} {isOverageEnabled && '+ usage fees '}will be
            charged on the 1st February 2022
          </p>
        </div>
        <div className="flex justify-end items-end">
          <p className="text-scale-1100 relative -top-[1px]">$</p>
          <p className="text-2xl">0</p>
        </div>
      </div>

      {/* Payment method selection */}
      {isLoadingPaymentMethods ? (
        <div className="flex items-center space-x-4">
          <IconLoader className="animate-spin" size={14} />
          <p className="text-sm">Retrieving payment methods</p>
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-scale-1100">No methods</div>
      ) : (
        <Listbox
          label="Select payment method"
          value={selectedPaymentMethod?.id}
          onChange={onSelectPaymentMethod}
        >
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
        </Listbox>
      )}
    </div>
  )
}

export default PaymentSummaryPanel
