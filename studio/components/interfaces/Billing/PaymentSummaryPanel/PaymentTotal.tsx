import { FC, useState } from 'react'
import { Loading, IconHelpCircle, Modal } from '@supabase/ui'
import { SubscriptionPreview } from '../Billing.types'
import CostBreakdownModal from './CostBreakdownModal'

interface Props {
  subscriptionPreview?: SubscriptionPreview
  isRefreshingPreview: boolean
  hasChangesToPlan: boolean
  isSpendCapEnabled: boolean
}

const PaymentTotal: FC<Props> = ({
  subscriptionPreview,
  isRefreshingPreview,
  hasChangesToPlan,
  isSpendCapEnabled,
}) => {
  const hasChanges = subscriptionPreview?.has_changes ?? false
  const hasCreditsBalance = (subscriptionPreview?.available_credit_balance ?? 0) > 0
  const availableCreditBalance = (subscriptionPreview?.available_credit_balance ?? 0) / 100
  const returnedCredits = (subscriptionPreview?.returned_credits_for_unused_time ?? 0) / 100
  const remainingCreditBalance = (subscriptionPreview?.remaining_credit_balance ?? 0) / 100

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
      {/* Credit balance details (If available) */}
      {/* {hasCreditsBalance && (
        <>
          <Loading active={isRefreshingPreview}>
            <div className="space-y-2">
              <div className="flex items-start justify-between space-x-20">
                <div>
                  <p className="text-sm">Available credit balance</p>
                  <p className="text-sm text-scale-1100">
                    Including credits returned for unused time from this change
                  </p>
                </div>
                <p className="text-sm">${availableCreditBalance.toFixed(2)}</p>
              </div>
            </div>
          </Loading>
          <div className="h-px w-full bg-scale-600" />
        </>
      )} */}

      {/* Payment total */}
      <Loading active={isRefreshingPreview}>
        <div className="mb-2 space-y-4">
          <div className="flex items-start justify-between space-x-12">
            <div className="">
              <div className="flex items-center space-x-2">
                <p>Total amount due</p>
                {hasChangesToPlan && (
                  <IconHelpCircle
                    size={16}
                    strokeWidth={1.5}
                    className="cursor-pointer opacity-50 hover:opacity-100 transition"
                    onClick={() => setShowCostBreakdown(true)}
                  />
                )}
              </div>
              {hasChanges ? (
                <div className="space-y-2">
                  <p className="text-sm text-scale-1100">
                    This amount {!isSpendCapEnabled && !isBillingToday && '+ usage fees '}will be
                    charged on{' '}
                    <span className="text-scale-1200">
                      {billingDate.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    .
                  </p>
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
                {!hasChangesToPlan
                  ? '0.00'
                  : (amountDueImmediately < 0 ? 0 : amountDueImmediately).toFixed(2)}
              </p>
            </div>
          </div>
          {/* {hasCreditsBalance && (
            <div className="flex items-start justify-between">
              <p className="text-sm">Remaining credit balance</p>
              <p className="text-sm">${remainingCreditBalance.toFixed(2)}</p>
            </div>
          )} */}
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
