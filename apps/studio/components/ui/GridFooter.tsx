import { PropsWithChildren } from 'react'
import { cn } from 'ui'

export const GridFooter = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div
      aria-label="Table grid footer"
      className={cn(
        'flex min-h-10 h-10 overflow-hidden overflow-x-auto items-center justify-between px-2 w-full border-t gap-x-8',
        className
      )}
    >
      {children}
    </div>
  )
}
