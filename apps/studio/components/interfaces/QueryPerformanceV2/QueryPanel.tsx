import { PropsWithChildren } from 'react'
import { cn } from 'ui'

export const QueryPanelContainer = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('flex flex-col gap-y-2 divide-y', className)}>{children}</div>
)

export const QueryPanelSection = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('py-4 px-4 flex flex-col gap-y-2', className)}>{children}</div>
)
