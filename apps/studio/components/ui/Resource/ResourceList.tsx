import { Card } from 'ui'
import { cn } from 'ui'
import { forwardRef } from 'react'

export interface ResourceListProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const ResourceList = forwardRef<HTMLDivElement, ResourceListProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Card ref={ref} {...props}>
        <div className={cn('divide-y divide-default', className)}>{children}</div>
      </Card>
    )
  }
)

ResourceList.displayName = 'ResourceList'
