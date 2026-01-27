import { components } from 'api-types'
import type { HTMLAttributes } from 'react'
import { cn } from 'ui'

interface ComputeBadgeProps extends HTMLAttributes<HTMLDivElement> {
  infraComputeSize:
    | components['schemas']['ProjectDetailResponse']['infra_compute_size']
    | '>16XL'
    | undefined
}

export function ComputeBadge({ infraComputeSize, className, ...props }: ComputeBadgeProps) {
  const smallCompute =
    infraComputeSize?.toLocaleLowerCase() === 'micro' ||
    infraComputeSize?.toLocaleLowerCase() === 'nano'

  const hasComputeSize = !!infraComputeSize

  return (
    <div
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md text-center font-mono uppercase',
        'whitespace-nowrap font-medium tracking-[0.06em] text-[11px] leading-[1.1] px-[5.5px] py-[3px]',
        'transition-all',
        // Variant styles
        !hasComputeSize
          ? 'bg-surface-75 text-foreground-light border border-strong'
          : smallCompute
            ? 'bg-surface-75 text-foreground-light border border-strong bg-opacity-50'
            : 'bg-brand bg-opacity-10 text-brand-600 border border-brand-500',
        // Hover card interaction styles
        'group-data-[state=open]:bg-opacity-20 group-data-[state=open]:ring-2 group-data-[state=open]:ring-opacity-20',
        smallCompute
          ? 'group-data-[state=open]:ring-foreground-muted group-data-[state=open]:bg-opacity-75'
          : 'group-data-[state=open]:ring-brand',
        className
      )}
      {...props}
    >
      {infraComputeSize}
    </div>
  )
}
