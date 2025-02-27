import { forwardRef, ReactNode, PropsWithChildren } from 'react'

export interface PrePostTabProps {
  preTab?: ReactNode | string
  postTab?: ReactNode | string
}

export const PrePostTab = forwardRef<HTMLDivElement, PropsWithChildren<PrePostTabProps>>(
  ({ preTab, postTab, children, ...props }, ref) => {
    return (
      <div ref={ref} className="flex -space-x-px" {...props}>
        {preTab && (
          <div className="border border-strong bg-surface-300 rounded-l-md px-3 flex items-center justify-center">
            <span className="text-foreground-lighter text-xs font-mono">{preTab}</span>
          </div>
        )}
        {children}
        {postTab && (
          <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
            <span className="text-foreground-lighter text-xs font-mono">{postTab}</span>
          </div>
        )}
      </div>
    )
  }
)
