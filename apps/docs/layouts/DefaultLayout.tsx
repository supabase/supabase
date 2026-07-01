import { type FC, type PropsWithChildren } from 'react'
import { cn } from 'ui'

export const LayoutMainContent: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => <div className={cn('max-w-6xl px-8 mx-auto pt-12 pb-8', className)}>{children}</div>
