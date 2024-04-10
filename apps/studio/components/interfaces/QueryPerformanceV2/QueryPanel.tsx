import { PropsWithChildren } from 'react'
import { cn } from 'ui'

export const QueryPanelContainer = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('flex flex-col gap-y-6 py-4', className)}>{children}</div>
)

export const QueryPanelSection = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('px-5 flex flex-col gap-y-2', className)}>{children}</div>
)
