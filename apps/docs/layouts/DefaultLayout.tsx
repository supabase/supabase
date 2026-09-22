import { type FC, type PropsWithChildren } from 'react'
import { cn } from 'ui'

export const LayoutMainContent: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => <div className={cn('max-w-6xl px-6 mx-auto pt-12 pb-6', className)}>{children}</div>
