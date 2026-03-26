import { Check, Clock3, HelpCircle, Pause, SkipForward, X } from 'lucide-react'
import type { ComponentType, HTMLAttributes, ReactNode } from 'react'
import { cn } from 'ui'

export type StatusBadgeStatus =
  | 'success'
  | 'failure'
  | 'pending'
  | 'skipped'
  | 'inactive'
  | 'unknown'

interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status: StatusBadgeStatus
  children?: ReactNode
}

type StatusBadgeTone = 'positive' | 'destructive' | 'neutral'

const statusBadgeClassName =
  'inline-flex items-center justify-center rounded-md text-center font-mono uppercase whitespace-nowrap font-medium tracking-[0.06em] text-[11px] leading-[1.1] px-[5.5px] py-[3px] transition-all border'

const statusBadgeToneClassNames: Record<StatusBadgeTone, string> = {
  positive: 'bg-brand bg-opacity-10 text-brand-600 border-brand-500',
  destructive: 'bg-destructive bg-opacity-10 text-destructive-600 border-destructive-500',
  neutral: 'bg-surface-75 text-foreground-light border-strong',
}

const statusBadgeConfig: Record<
  StatusBadgeStatus,
  {
    label: string
    tone: StatusBadgeTone
    icon: ComponentType<{ className?: string }>
  }
> = {
  success: {
    label: 'Success',
    tone: 'positive',
    icon: Check,
  },
  failure: {
    label: 'Failure',
    tone: 'destructive',
    icon: X,
  },
  pending: {
    label: 'Pending',
    tone: 'neutral',
    icon: Clock3,
  },
  skipped: {
    label: 'Skipped',
    tone: 'neutral',
    icon: SkipForward,
  },
  inactive: {
    label: 'Inactive',
    tone: 'neutral',
    icon: Pause,
  },
  unknown: {
    label: 'Unknown',
    tone: 'neutral',
    icon: HelpCircle,
  },
}

export function StatusBadge({ status, className, children, ...props }: StatusBadgeProps) {
  const { label, tone, icon: Icon } = statusBadgeConfig[status]
  const toneClassName = statusBadgeToneClassNames[tone]

  return (
    <div
      className={cn('inline-flex items-center whitespace-nowrap', className)}
      data-status={status}
      data-tone={tone}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="status-badge-icon"
        className={cn(statusBadgeClassName, toneClassName, 'rounded-r-none border-r-0')}
      >
        <Icon className="size-3 shrink-0" />
      </span>
      <span
        data-slot="status-badge-label"
        className={cn(statusBadgeClassName, toneClassName, 'rounded-l-none')}
      >
        {children ?? label}
      </span>
    </div>
  )
}
