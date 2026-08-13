import { Eye, GitBranch, NotebookText, ScrollText, SquareCode, Table2 } from 'lucide-react'
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
  <ScrollText
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
    | 'explorer-home'
  size?: number
  strokeWidth?: number
  isActive?: boolean
  sqlSource?: SqlSnippetSource
}

export const EntityTypeIcon = ({
  type,
  size = 15,
  strokeWidth = 1.5,
  isActive,
  sqlSource,
}: EntityTypeIconProps) => {
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
      <Table2
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'text-foreground-muted group-hover:text-foreground-lighter group-aria-selected:text-foreground',
          isActive && 'text-foreground-light',
          'transition-colors'
        )}
      />
    )
  }

  if (type === 'schema') {
    return <GitBranch size={size} strokeWidth={strokeWidth} />
  }

  if (type === ENTITY_TYPE.VIEW) {
    return (
      <Eye
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'text-foreground-muted group-hover:text-foreground-lighter',
          isActive && 'text-foreground-lighter',
          'transition-colors'
        )}
      />
    )
  }

  if (type === 'notebook') {
    return <NotebookText size={size} strokeWidth={strokeWidth} className={''} />
  }

  if (type === 'query') {
    return <SquareCode size={size} strokeWidth={strokeWidth} />
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center text-xs h-4 w-4 rounded-[2px] font-bold',
        type === ENTITY_TYPE.FOREIGN_TABLE &&
          'text-warning-600/80 dark:text-yellow-900 bg-yellow-500',
        type === ENTITY_TYPE.MATERIALIZED_VIEW && 'text-purple-1100 bg-purple-500',
        type === ENTITY_TYPE.PARTITIONED_TABLE &&
          'text-foreground-light bg-surface-400 dark:bg-border-stronger'
      )}
    >
      {Object.entries(ENTITY_TYPE)
        .find(([, value]) => value === type)?.[0]?.[0]
        ?.toUpperCase()}
    </div>
  )
}
