import { type FC, type PropsWithChildren } from 'react'
import { cn } from 'ui'

export const LayoutMainContent: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => <div className={cn('max-w-7xl px-5 mx-auto py-8', className)}>{children}</div>
