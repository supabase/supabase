import type { ComponentProps } from 'react'
import { cn } from 'ui'

import { SEVERITY_LABELS } from './Issues.constants'
import type { IssueSeverity } from '@/data/issues/issue.types'

const FILLED_BAR_COUNT: Record<IssueSeverity, number> = {
  info: 1,
  warning: 2,
  critical: 3,
}

const FILLED_BAR_COLORS: Record<IssueSeverity, string> = {
  info: 'text-foreground-lighter',
  warning: 'text-warning',
  critical: 'text-destructive',
}

const BAR_HEIGHTS = [4, 7, 10]

type SeverityIndicatorProps = { severity: IssueSeverity } & Omit<ComponentProps<'svg'>, 'children'>

/**
 * Three ascending bars, filled up to the issue's severity in its color: one gray bar for info,
 * two yellow for warning, three red for critical. Pass `aria-hidden` when the severity label is
 * already shown next to it.
 */
export const SeverityIndicator = ({ severity, className, ...props }: SeverityIndicatorProps) => {
  const filledBarCount = FILLED_BAR_COUNT[severity]

  return (
    <svg
      viewBox="0 0 12 12"
      role="img"
      aria-label={SEVERITY_LABELS[severity]}
      className={cn('size-3 shrink-0', FILLED_BAR_COLORS[severity], className)}
      {...props}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <rect
          key={height}
          x={1 + index * 4}
          y={11 - height}
          width={2}
          height={height}
          rx={0.5}
          className={index < filledBarCount ? 'fill-current' : 'fill-border-stronger'}
        />
      ))}
    </svg>
  )
}
