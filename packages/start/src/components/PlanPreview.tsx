'use client'

import { cn } from 'ui'

import { renderPlan } from '../lib/plan-render'

interface PlanPreviewProps {
  plan: string
  onOpen?: () => void
  className?: string
}

export function PlanPreview({ plan, onOpen, className }: PlanPreviewProps) {
  const Component = onOpen ? 'button' : 'div'

  return (
    <Component
      type={onOpen ? 'button' : undefined}
      onClick={onOpen}
      className={cn(
        'relative w-full overflow-hidden rounded-md border border-default text-left',
        onOpen && 'cursor-pointer transition-colors hover:border-strong',
        className
      )}
    >
      <div className="max-h-36 overflow-hidden px-3.5 py-3">
        <pre className="m-0 whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-foreground-light">
          {renderPlan(plan)}
        </pre>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-b from-transparent to-background"
      />
    </Component>
  )
}
