import { ChevronRight } from 'lucide-react'
import { CardContent, cn } from 'ui'
import { forwardRef } from 'react'

export interface ResourceItemProps extends React.HTMLAttributes<HTMLDivElement> {
  media?: React.ReactNode
  meta?: React.ReactNode
  onClick?: () => void
  children?: React.ReactNode
}

export const ResourceItem = forwardRef<HTMLDivElement, ResourceItemProps>(
  ({ media, meta, onClick, children, className, ...props }, ref) => {
    return (
      <CardContent
        ref={ref}
        className={cn(
          'flex items-center justify-between text-sm gap-4',
          onClick && 'cursor-pointer hover:bg-surface-200',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {media && (
          <div className="text-foreground-light flex items-center justify-center">{media}</div>
        )}
        <div className="flex-1">{children}</div>
        {meta && <div>{meta}</div>}
        {onClick && <ChevronRight strokeWidth={1.5} size={16} />}
      </CardContent>
    )
  }
)

ResourceItem.displayName = 'ResourceItem'
