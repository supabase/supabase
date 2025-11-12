'use client'

import * as React from 'react'
import { cn } from 'ui'
import { useContext } from 'react'

interface MetricsBlockContextValue {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricsBlockContext = React.createContext<MetricsBlockContextValue>({
  isLoading: false,
  isDisabled: false,
})

const useMetricsBlock = () => {
  return useContext(MetricsBlockContext)
}

interface MetricsBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricsBlock = React.forwardRef<HTMLDivElement, MetricsBlockProps>(
  ({ isLoading = false, isDisabled = false, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        <MetricsBlockContext.Provider value={{ isLoading, isDisabled }}>
          {children}
        </MetricsBlockContext.Provider>
      </div>
    )
  }
)
MetricsBlock.displayName = 'MetricsBlock'

const MetricsBlockHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'py-4 px-6 flex flex-row items-center justify-between gap-2 space-y-0 pb-0 border-b-0 relative',
        className
      )}
      {...props}
    />
  )
)
MetricsBlockHeader.displayName = 'MetricsBlockHeader'

const MetricsBlockIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-foreground-light', className)} {...props} />
  )
)
MetricsBlockIcon.displayName = 'MetricsBlockIcon'

const MetricsBlockLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-foreground-light', className)} {...props} />
  )
)
MetricsBlockLabel.displayName = 'MetricsBlockLabel'

/* TO DO: 
===========================
- MetricsBlockValue 
- MetricsBlockContent
- MetricsBlockDifferential
- MetricsBlockSparkline 
- CSS for all of this
- Functionality too.
===========================
*/

export { MetricsBlock, MetricsBlockHeader, MetricsBlockIcon, MetricsBlockLabel, useMetricsBlock }
