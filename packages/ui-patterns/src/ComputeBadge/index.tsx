import { components } from 'api-types'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from 'ui'

interface ComputeBadgeProps extends HTMLAttributes<HTMLDivElement> {
  infraComputeSize:
    | components['schemas']['ProjectDetailResponse']['infra_compute_size']
    | '>16XL'
    | undefined
  icon?: ReactNode
}

export function ComputeBadge({ infraComputeSize, className, icon, ...props }: ComputeBadgeProps) {
  const smallCompute =
    infraComputeSize?.toLocaleLowerCase() === 'micro' ||
    infraComputeSize?.toLocaleLowerCase() === 'nano'

  const hasComputeSize = !!infraComputeSize

  return (
    <div
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-sm text-center font-mono uppercase',
        'whitespace-nowrap font-medium tracking-[0.06em] text-[11px] leading-[1.1] px-[5.5px] py-[3px]',
        'transition-all',
        // Variant styles
        !hasComputeSize
          ? 'bg-surface-75 group-data-[state=open]:bg-surface-75/20 text-foreground-light border border-strong'
          : smallCompute
            ? 'bg-surface-75/50 group-data-[state=open]:bg-surface-75/75 text-foreground-light border border-strong'
            : 'bg-brand/10 group-data-[state=open]:bg-brand/20 text-brand-600 border border-brand-500',
        // Hover card interaction styles
        'group-data-[state=open]:ring-2',
        smallCompute
          ? 'group-data-[state=open]:ring-foreground-muted/20'
          : 'group-data-[state=open]:ring-brand/20',
        className
      )}
      {...props}
    >
      {infraComputeSize}
      {icon && <span className="flex items-center">{icon}</span>}
    </div>
  )
}
