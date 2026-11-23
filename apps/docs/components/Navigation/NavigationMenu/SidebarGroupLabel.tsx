import type { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface SidebarGroupLabelProps extends PropsWithChildren {
  className?: string
}

export const SidebarGroupLabel = ({ className, children }: SidebarGroupLabelProps) => (
  <span
    className={cn(
      'flex items-center gap-3 pt-3 text-xs font-medium text-foreground-lighter',
      className
    )}
  >
    {children}
    <span aria-hidden className="h-px flex-1 bg-border" />
  </span>
)
