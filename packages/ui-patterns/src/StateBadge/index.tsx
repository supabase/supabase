import { ToggleLeft, ToggleRight } from 'lucide-react'
import type { ComponentType, HTMLAttributes, ReactNode } from 'react'
import { cn } from 'ui'

export type StateBadgeState = 'enabled' | 'disabled'

interface StateBadgeProps extends HTMLAttributes<HTMLDivElement> {
  state: StateBadgeState
  children?: ReactNode
}

type StateBadgeTone = 'positive' | 'neutral'

const stateBadgeClassName =
  'inline-flex items-center justify-center gap-1.5 rounded-md text-center font-mono uppercase whitespace-nowrap font-medium tracking-[0.06em] text-[11px] leading-[1.1] px-[7px] py-[3px] transition-all border'

const stateBadgeToneClassNames: Record<StateBadgeTone, string> = {
  positive: 'bg-brand bg-opacity-10 text-brand-600 border-brand-500',
  neutral: 'bg-surface-75 text-foreground-light border-strong',
}

const stateBadgeConfig: Record<
  StateBadgeState,
  {
    label: string
    tone: StateBadgeTone
    icon: ComponentType<{ className?: string }>
  }
> = {
  enabled: {
    label: 'Enabled',
    tone: 'positive',
    icon: ToggleRight,
  },
  disabled: {
    label: 'Disabled',
    tone: 'neutral',
    icon: ToggleLeft,
  },
}

export function StateBadge({ state, className, children, ...props }: StateBadgeProps) {
  const { label, tone, icon: Icon } = stateBadgeConfig[state]

  return (
    <div
      className={cn(stateBadgeClassName, stateBadgeToneClassNames[tone], className)}
      data-state={state}
      data-tone={tone}
      {...props}
    >
      <Icon aria-hidden="true" data-slot="state-badge-icon" className="size-3 shrink-0" />
      <span data-slot="state-badge-label">{children ?? label}</span>
    </div>
  )
}
