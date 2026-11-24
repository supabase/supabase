import { InfoIcon } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { type DueTodayBreakdown } from './PlanChangeSummary.utils'
import { formatCurrency } from '@/lib/helpers'

const TooltipLine = ({
  label,
  amount,
  isCredit = false,
  className,
}: {
  label: string
  amount: number
  isCredit?: boolean
  className?: string
}) => (
  <div className={cn('flex items-center justify-between gap-6 py-1', className)}>
    <span className="text-foreground-light">{label}</span>
    <span
      className={cn('tabular-nums', isCredit ? 'text-brand' : 'text-foreground')}
      translate="no"
    >
      {isCredit ? `−${formatCurrency(amount)}` : formatCurrency(amount)}
    </span>
  </div>
)

interface DueTodayRowProps {
  breakdown: DueTodayBreakdown
  planName: string
  /** Set for an org moving off a plan it has already paid for. */
  currentPlanName?: string
}

/**
 * What the customer pays right now, and — behind the amount — why it differs from the
 * plan's sticker price. Ongoing compute is invoiced at the end of the cycle, not today.
 */
export const DueTodayRow = ({ breakdown, planName, currentPlanName }: DueTodayRowProps) => {
  const { planAmount, creditBalance, proratedCredit, tax, dueToday, isReduced } = breakdown
  const hasCreditsApplied = creditBalance > 0 || proratedCredit > 0

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-base text-foreground">Due today</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-baseline gap-2">
          {isReduced && (
            <span className="text-sm text-foreground-lighter line-through" translate="no">
              {formatCurrency(planAmount)}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1.5" translate="no">
              <span className="text-2xl text-foreground tabular-nums underline decoration-dotted underline-offset-4">
                {formatCurrency(dueToday)}
              </span>
              <InfoIcon size={14} className="text-foreground-lighter" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="w-72 p-3">
              {hasCreditsApplied && (
                <>
                  <p className="mb-1 text-foreground">Credits applied</p>
                  <p className="mb-2 text-foreground-light">
                    {creditBalance > 0
                      ? "Your organization's credit balance is applied to this first payment. Next month is the regular plan price."
                      : `Time you have already paid for on ${currentPlanName ?? 'your current plan'} is credited against this payment.`}
                  </p>
                </>
              )}
              <div className={cn('pt-1', hasCreditsApplied && 'border-t')}>
                <TooltipLine label={`${planName} Plan`} amount={planAmount} />
                {tax && <TooltipLine label={`Tax (${tax.ratePercentage}%)`} amount={tax.amount} />}
                {creditBalance > 0 && (
                  <TooltipLine label="Credit balance" amount={creditBalance} isCredit />
                )}
                {proratedCredit > 0 && (
                  <TooltipLine
                    label={`Unused ${currentPlanName ?? 'plan'} time`}
                    amount={proratedCredit}
                    isCredit
                  />
                )}
                <TooltipLine label="Due today" amount={dueToday} className="border-t" />
              </div>
              <p className="mt-2 text-foreground-lighter">
                The plan fee is charged upfront. Compute and other usage is billed at the end of
                each billing cycle.
              </p>
              {breakdown.isTaxEstimateUnavailable && (
                <p className="mt-2 text-foreground-lighter">
                  Tax could not be estimated and may be applied separately.
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
