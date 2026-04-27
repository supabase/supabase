import { cn } from 'ui'

import { formatCurrency } from '@/lib/helpers'

export interface ChargeBreakdownProps {
  subtotal: number
  total: number
  tax?: { amount: number; percentage: number }
  taxStatus?: 'calculated' | 'failed' | 'not_applicable'
  isFetching: boolean
}

export const ChargeBreakdown = ({
  subtotal,
  total,
  tax,
  taxStatus,
  isFetching,
}: ChargeBreakdownProps) => {
  return (
    <div
      className={cn('text-foreground-light text-sm transition-opacity', isFetching && 'opacity-50')}
    >
      {total !== subtotal && (
        <div className="flex items-center justify-between gap-2 border-b border-muted text-sm">
          <div className="py-2">Subtotal</div>
          <div className="py-2 text-right tabular-nums" translate="no">
            {formatCurrency(subtotal)}
          </div>
        </div>
      )}

      {taxStatus === 'calculated' && tax && tax.amount > 0 && (
        <div className="flex items-center justify-between gap-2 border-b border-muted text-sm">
          <div className="py-2">Tax ({tax.percentage}%)</div>
          <div className="py-2 text-right tabular-nums" translate="no">
            {formatCurrency(tax.amount)}
          </div>
        </div>
      )}

      {taxStatus === 'failed' && (
        <div className="flex items-center justify-between gap-2 border-b border-muted text-sm">
          <div className="py-2 text-foreground-lighter">
            Tax could not be estimated and may be applied separately
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-foreground text-base">
        <div className="py-2">Total due today</div>
        <div className="py-2 text-right tabular-nums" translate="no">
          {formatCurrency(total)}
        </div>
      </div>
    </div>
  )
}
