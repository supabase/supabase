import { CirclePlus, Eye, Table2, Workflow } from 'lucide-react'
import { TabType } from 'state/tabs'
import { cn, SQL_ICON } from 'ui'

interface TabIconProps {
  size?: number
  strokeWidth?: number
  className?: string
  type: TabType
}

export const TabIcon = ({ type, size = 14, strokeWidth = 1.5, className }: TabIconProps) => {
  switch (type) {
    case 'schema':
      return (
        <Workflow
          size={size}
          strokeWidth={strokeWidth}
          className={className ?? 'text-foreground-lighter'}
        />
      )
    case 'table':
      return (
        <Table2
          size={size}
          strokeWidth={strokeWidth}
          className={className ?? 'text-foreground-lighter'}
        />
      )
    case 'view':
      return (
        <Eye
          size={size}
          strokeWidth={strokeWidth}
          className={className ?? 'text-foreground-lighter'}
        />
      )
    case 'sql':
      return (
        <SQL_ICON
          className={cn(
            'transition-colors',
            'fill-foreground-muted',
            'group-aria-selected:fill-foreground',
            className,
            'w-4 h-4',
            '-ml-0.5'
          )}
          strokeWidth={strokeWidth}
        />
      )
    default:
      return (
        <CirclePlus
          size={size}
          strokeWidth={strokeWidth}
          className={className ?? 'text-foreground-lighter'}
        />
      )
  }
}
