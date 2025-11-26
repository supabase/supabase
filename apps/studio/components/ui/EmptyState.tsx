import type { LucideIcon } from 'lucide-react'
import { isValidElement, ReactNode } from 'react'

import { cn } from 'ui'

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode
  title: string
  description?: string | ReactNode
  children?: ReactNode
  className?: string
  iconSize?: number
  iconClassName?: string
  contentClassName?: string
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  children,
  className,
  iconSize = 24,
  iconClassName,
  contentClassName,
}: EmptyStateProps) => {
  return (
    <aside
      className={cn(
        'border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col items-center',
        children ? 'gap-y-6' : 'gap-y-3',
        className
      )}
    >
      {Icon && (
        <div className="flex flex-col gap-y-3 items-center">
          {isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon
              size={iconSize}
              strokeWidth={1.5}
              className={cn('text-foreground-muted', iconClassName)}
            />
          )}

          <div
            className={cn('flex flex-col items-center text-center text-balance', contentClassName)}
          >
            <h3>{title}</h3>
            {description && (
              <p className="text-foreground-light text-sm max-w-[720px]">{description}</p>
            )}
          </div>
        </div>
      )}

      {!Icon && (
        <div className={cn('flex flex-col items-center text-center', contentClassName)}>
          <h3>{title}</h3>
          {description && (
            <p className="text-foreground-light text-sm max-w-[720px]">{description}</p>
          )}
        </div>
      )}

      {children}
    </aside>
  )
}
