import type { ReactNode } from 'react'
import { cn } from 'ui'

interface SupportSuccessSectionProps {
  icon?: ReactNode
  title: string
  description: ReactNode
  action?: ReactNode
  children?: ReactNode
  className?: string
  headerClassName?: string
}

export function SupportSuccessSection({
  icon,
  title,
  description,
  action,
  children,
  className,
  headerClassName,
}: SupportSuccessSectionProps) {
  const hasIcon = icon !== undefined

  return (
    <div className={cn('w-full py-1', className)}>
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
            headerClassName
          )}
        >
          <div className={cn('flex min-w-0 flex-1 items-start', hasIcon ? 'gap-3' : 'gap-0')}>
            {hasIcon && (
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
                {icon}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <h4 className="text-sm font-medium text-foreground">{title}</h4>
              <div className="text-sm text-foreground-light">{description}</div>
            </div>
          </div>
          {action && <div className="shrink-0 sm:ml-4">{action}</div>}
        </div>
        {children && <div className={cn(hasIcon && 'sm:pl-[52px]')}>{children}</div>}
      </div>
    </div>
  )
}
