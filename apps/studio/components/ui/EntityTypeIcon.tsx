import {
  EyeIcon,
  GitBranchIcon,
  MessageSquareIcon,
  NotebookTextIcon,
  ScrollTextIcon,
  SquareCodeIcon,
  Table2Icon,
} from 'lucide-react'
import { cn, SQL_ICON } from 'ui'

import type { SqlSnippetSource } from '@/components/interfaces/SQLEditor/querySource'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

/**
 * The single icon representing a logs (`log_sql`) snippet — reused by the tabs
 * (via EntityTypeIcon) and the nav tree so the two can't drift. Callers pass the
 * context-appropriate size/className; the icon and stroke stay the same.
 */
export const LogsSnippetIcon = ({
  size = 15,
  strokeWidth = 1.5,
  className,
}: {
  size?: number
  strokeWidth?: number
  className?: string
}) => (
  <ScrollTextIcon
    size={size}
    strokeWidth={strokeWidth}
    className={cn('transition-colors', className)}
  />
)

interface EntityTypeIconProps {
  type:
    | 'sql'
    | 'schema'
    | 'new'
    | 'r'
    | 'v'
    | 'm'
    | 'f'
    | 'p'
    | 'notebook'
    | 'query'
    | 'chat'
    | 'explorer-home'
  size?: number
  strokeWidth?: number
  isActive?: boolean
  sqlSource?: SqlSnippetSource
  isPartition?: boolean
  className?: string
}

export const EntityTypeIcon = ({
  type: entityType,
  size = 15,
  strokeWidth = 1.5,
  isActive,
  sqlSource,
  isPartition = false,
  className,
}: EntityTypeIconProps) => {
  const type = isPartition ? ENTITY_TYPE.PARTITIONED_TABLE : entityType

  if (type === 'sql' && sqlSource === 'logs') {
    return (
      <LogsSnippetIcon
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'text-foreground-muted',
          'group-aria-selected:text-foreground',
          'w-4 h-4',
          '-ml-0.5'
        )}
      />
    )
  }

  if (type === 'sql') {
    return (
      <SQL_ICON
        size={size}
        className={cn(
          'transition-colors',
          'fill-foreground-muted',
          'group-aria-selected:fill-foreground',
          'w-4 h-4',
          '-ml-0.5'
        )}
        strokeWidth={strokeWidth}
      />
    )
  }

  if (type === ENTITY_TYPE.TABLE) {
    return (
      <Table2Icon
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'text-foreground-muted group-hover:text-foreground-lighter group-aria-selected:text-foreground',
          isActive && 'text-foreground-light',
          'transition-colors',
          className
        )}
      />
    )
  }

  if (type === 'schema') {
    return <GitBranchIcon size={size} strokeWidth={strokeWidth} />
  }

  if (type === ENTITY_TYPE.VIEW) {
    return (
      <EyeIcon
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'text-foreground-muted group-hover:text-foreground-lighter group-aria-selected:text-foreground',
          isActive && 'text-foreground-lighter',
          'transition-colors',
          className
        )}
      />
    )
  }

  if (type === 'notebook') {
    return <NotebookTextIcon size={size} strokeWidth={strokeWidth} className={''} />
  }

  if (type === 'query') {
    return <SquareCodeIcon size={size} strokeWidth={strokeWidth} />
  }

  if (type === 'chat') {
    return <MessageSquareIcon size={size} strokeWidth={strokeWidth} />
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center text-xs h-4 w-4 rounded-[2px] font-bold',
        type === ENTITY_TYPE.FOREIGN_TABLE &&
          'text-warning-600/80 dark:text-yellow-900 bg-yellow-500',
        type === ENTITY_TYPE.MATERIALIZED_VIEW && 'text-purple-1100 bg-purple-500',
        type === ENTITY_TYPE.PARTITIONED_TABLE &&
          `${isPartition ? 'text-blue-1100 bg-blue-500 dark:bg-blue-500' : 'text-foreground bg-blue-700 dark:bg-blue-800'}`
      )}
    >
      {Object.entries(ENTITY_TYPE)
        .find(([, value]) => value === type)?.[0]?.[0]
        ?.toUpperCase()}
    </div>
  )
}
