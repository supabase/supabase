import { forwardRef, ReactNode, PropsWithChildren, HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface PrePostTabProps extends HTMLAttributes<HTMLDivElement> {
  preTab?: ReactNode | string
  postTab?: ReactNode | string
}

export const PrePostTab = forwardRef<HTMLDivElement, PropsWithChildren<PrePostTabProps>>(
  ({ preTab, postTab, children, className, ...props }, ref) => {
    return (
      <div ref={ref} {...props} className={cn('flex -space-x-px', className)}>
        {preTab && (
          <div className="border border-strong bg-surface-300 rounded-l-md px-3 flex items-center justify-center">
            <span className="text-foreground-lighter text-xs font-mono">{preTab}</span>
          </div>
        )}
        <div className="flex-1 [&_input:rounded-r-0]">{children}</div>
        {postTab && (
          <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
            <span className="text-foreground-lighter text-xs font-mono">{postTab}</span>
          </div>
        )}
      </div>
    )
  }
)
