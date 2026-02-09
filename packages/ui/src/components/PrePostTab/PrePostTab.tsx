import { forwardRef, HTMLAttributes, PropsWithChildren, ReactNode } from 'react'

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
            <span className="text-foreground-light text-xs font-mono">{preTab}</span>
          </div>
        )}
        <div
          className={cn('flex-1', {
            '[&_input]:rounded-l-none [&_select]:rounded-l-none [&_textarea]:rounded-l-none':
              Boolean(preTab),
            '[&_input]:rounded-r-none [&_select]:rounded-r-none [&_textarea]:rounded-r-none':
              Boolean(postTab),
          })}
        >
          {children}
        </div>
        {postTab && (
          <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
            <span className="text-foreground-light text-xs font-mono">{postTab}</span>
          </div>
        )}
      </div>
    )
  }
)
