import { forwardRef, ReactNode } from 'react'

interface InputPostTabProps {
  children: ReactNode
  label: string
}

export const InputPostTab = forwardRef<HTMLDivElement, InputPostTabProps>(
  ({ children, label }, ref) => {
    return (
      <div ref={ref} className="flex -space-x-px">
        {children}
        <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
          <span className="text-foreground-lighter text-xs font-mono">{label}</span>
        </div>
      </div>
    )
  }
)

InputPostTab.displayName = 'InputPostTab'
