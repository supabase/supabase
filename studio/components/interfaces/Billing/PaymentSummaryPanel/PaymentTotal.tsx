import { FC } from 'react'
import { Loading } from '@supabase/ui'
import { SubscriptionPreview } from '../Billing.types'

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
  const hasCreditsBalance = (subscriptionPreview?.available_credit_balance ?? 0) > 0
  const availableCreditBalance = (subscriptionPreview?.available_credit_balance ?? 0) / 100
  const remainingCreditBalance = (subscriptionPreview?.remaining_credit_balance ?? 0) / 100

  const totalMonthlyCost = (subscriptionPreview?.base_amount_due_next_billing_cycle ?? 0) / 100
  const amountDueImmediately = (subscriptionPreview?.amount_due_immediately ?? 0) / 100
  const nextInvoiceDate = new Date((subscriptionPreview?.next_billing_cycle ?? 0) * 1000)

  return (
    <>
      {/* Credit balance details (If available) */}
      {hasCreditsBalance && (
        <>
          <Loading active={isRefreshingPreview}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm">Total amount due</p>
                <p className="text-sm">
                  $
                  {((subscriptionPreview?.base_amount_due_next_billing_cycle ?? 0) / 100).toFixed(
                    2
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm">Available credit balance</p>
                <p className="text-sm">${availableCreditBalance.toFixed(2)}</p>
              </div>
            </div>
          </Loading>
          <div className="h-px w-full bg-scale-600" />
        </>
      )}

      {/* Payment total */}
      <Loading active={isRefreshingPreview}>
        <div className="mb-2">
          <div className="flex items-start justify-between">
            <p>Amount due today</p>
            <div className="flex justify-end items-end relative -top-[5px]">
              <p className="text-scale-1100 relative -top-[1px]">$</p>
              <p className="text-2xl">{amountDueImmediately.toFixed(2)}</p>
            </div>
          </div>
          {hasCreditsBalance && (
            <div className="flex items-start justify-between">
              <p className="text-sm">Remaining credit balance</p>
              <p className="text-sm">${remainingCreditBalance.toFixed(2)}</p>
            </div>
          )}
        </div>
        {hasChangesToPlan && (
          <div className="w-2/3">
            <p className="text-sm text-scale-1100">
              You'll pay a monthly total of{' '}
              <span className="text-scale-1200">
                ${totalMonthlyCost} {!isSpendCapEnabled && '+ usage fees '}
              </span>
              starting on{' '}
              {nextInvoiceDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </Loading>
    </>
  )
}

export default PaymentTotal
