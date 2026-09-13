import { cn } from 'ui'

import { formatCurrency } from '@/lib/helpers'

export interface BreakdownRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

export const BreakdownRow = ({ label, description, children }: BreakdownRowProps) => (
  <div className="flex items-start justify-between py-3 px-0 border-b border-dashed last:border-b-0">
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-foreground-light">{label}</span>
      {description && <span className="text-xs text-warning-600 max-w-72">{description}</span>}
    </div>
    {children}
  </div>
)

export const ValueChange = ({ from, to }: { from: string; to: string }) => (
  <span className="text-sm font-mono uppercase">
    <span className="text-foreground-lighter">{from}</span>
    <span className="text-foreground-lighter mx-2">&rarr;</span>
    <span className="text-foreground">{to}</span>
  </span>
)

export const PriceDelta = ({ delta }: { delta: number }) => (
  <span className={cn('text-xs', delta >= 0 ? 'text-brand' : 'text-destructive')}>
    {delta >= 0 ? `+${formatCurrency(delta)}` : `-${formatCurrency(Math.abs(delta))}`}{' '}
    <span className="text-foreground-lighter">per month</span>
  </span>
)
