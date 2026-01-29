import { ChevronRight, MoreVertical } from 'lucide-react'
import { forwardRef, HTMLAttributes, ReactNode } from 'react'

import {
  Button,
  CardContent,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

export interface ResourceAction {
  label: string
  onClick: () => void
}

export interface ResourceItemProps extends HTMLAttributes<HTMLDivElement> {
  media?: ReactNode
  meta?: ReactNode
  onClick?: () => void
  children?: ReactNode
  actions?: ResourceAction[]
}

export const ResourceItem = forwardRef<HTMLDivElement, ResourceItemProps>(
  ({ media, meta, onClick, children, className, actions, ...props }, ref) => {
    return (
      <CardContent
        ref={ref}
        className={cn(
          'flex items-center justify-between text-sm gap-4',
          '!border-b-0',
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
        {actions && actions.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="text"
                className="px-1"
                icon={<MoreVertical size={16} />}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick()
                  }}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          onClick && <ChevronRight strokeWidth={1.5} size={16} />
        )}
      </CardContent>
    )
  }
)

ResourceItem.displayName = 'ResourceItem'
