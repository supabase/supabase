import { forwardRef, HTMLAttributes, ReactNode } from 'react'

import { Card } from 'ui'

export interface ResourceListProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export const ResourceList = forwardRef<HTMLDivElement, ResourceListProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Card ref={ref} className="overflow-hidden" {...props}>
        <div className={className}>{children}</div>
      </Card>
    )
  }
)

ResourceList.displayName = 'ResourceList'
