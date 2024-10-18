import { PropsWithChildren } from 'react'
import { cn } from 'ui'

export const GridFooter = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div
      className={cn(
        'flex min-h-9 h-9 overflow-hidden items-center px-2 w-full border-t',
        className
      )}
    >
      {children}
    </div>
  )
}
