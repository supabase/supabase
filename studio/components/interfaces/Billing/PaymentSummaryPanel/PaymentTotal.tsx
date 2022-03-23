import { FC, useState } from 'react'
import { Loading, IconHelpCircle, Button } from '@supabase/ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { SubscriptionPreview } from '../Billing.types'
import CostBreakdownModal from './CostBreakdownModal'

interface Props {
  subscriptionPreview?: SubscriptionPreview
  isRefreshingPreview: boolean
  isSpendCapEnabled: boolean
}

const PaymentTotal: FC<Props> = ({
  subscriptionPreview,
  isRefreshingPreview,
  isSpendCapEnabled,
}) => {
  const hasChanges = subscriptionPreview?.has_changes ?? false
  const totalMonthlyCost = (subscriptionPreview?.base_amount_due_next_billing_cycle ?? 0) / 100
  const amountDueImmediately = (subscriptionPreview?.amount_due_immediately ?? 0) / 100
  const billingDate = new Date((subscriptionPreview?.bill_on ?? 0) * 1000)
  const isBillingToday =
    new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) ===
    billingDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const [showCostBreakdown, setShowCostBreakdown] = useState(false)

  return (
    <>
      {/* Payment total */}
      <Loading active={isRefreshingPreview}>
        <div className="mb-2 space-y-4">
          <div className="flex items-start justify-between space-x-12">
            <div className="">
              <div className="flex items-center space-x-2">
                <p>Total amount due</p>
                {hasChanges && (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <IconHelpCircle
                        size={16}
                        strokeWidth={1.5}
                        className="cursor-pointer opacity-50 hover:opacity-100 transition"
                        onClick={() => setShowCostBreakdown(true)}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'bg-scale-100 shadow py-1 px-2 rounded leading-none', // background
                          'border border-scale-200 ', //border
                        ].join(' ')}
                      >
                        <span className="text-scale-1200 text-xs">How is this calculated?</span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Root>
                )}
              </div>
              {hasChanges ? (
                <div className="space-y-2">
                  {amountDueImmediately < 0 ? (
                    <p className="text-sm text-scale-1100">
                      A total of ${Math.abs(amountDueImmediately).toFixed(2)} will be returned on{' '}
                      <span className="font-bold text-green-1100">
                        {billingDate.toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>{' '}
                      for unused resources.
                    </p>
                  ) : (
                    <p className="text-sm text-scale-1100">
                      This amount {!isSpendCapEnabled && !isBillingToday && '+ usage fees '}will be
                      charged on{' '}
                      <span className="font-bold text-green-1100">
                        {billingDate.toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      .
                    </p>
                  )}
                  <p className="text-sm text-scale-1100">
                    You'll pay a monthly total of{' '}
                    <span className="text-scale-1200">
                      ${totalMonthlyCost} {!isSpendCapEnabled && '+ usage fees '}
                    </span>{' '}
                    for each subsequent billing cycle.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-scale-1100">No changes to current subscription</p>
              )}
            </div>
            <div className="flex justify-end items-end relative -top-[8px]">
              <p className="text-scale-1100 relative -top-[1px]">$</p>
              <p className="text-2xl">
                {!hasChanges
                  ? '0.00'
                  : (amountDueImmediately < 0 ? 0 : amountDueImmediately).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </Loading>

      <CostBreakdownModal
        visible={showCostBreakdown}
        totalDue={amountDueImmediately}
        billingDate={billingDate}
        costBreakdown={subscriptionPreview?.cost_breakdown || []}
        onCancel={() => setShowCostBreakdown(false)}
      />
    </>
  )
}

export default PaymentTotal
