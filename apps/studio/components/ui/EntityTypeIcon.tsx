import { Eye, GitBranch, Table2 } from 'lucide-react'
import { cn, SQL_ICON } from 'ui'

import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

interface EntityTypeIconProps {
  type: 'sql' | 'schema' | 'new' | 'r' | 'v' | 'm' | 'f' | 'p' | 'w'
  size?: number
  strokeWidth?: number
  isActive?: boolean
}

export const EntityTypeIcon = ({
  type,
  size = 15,
  strokeWidth = 1.5,
  isActive,
}: EntityTypeIconProps) => {
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

  if (type === ENTITY_TYPE.WAREHOUSE_TABLE) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center text-xs h-4 w-4 rounded-[2px] font-bold leading-none',
          'text-brand-600/90 dark:text-brand bg-brand-400/20 dark:bg-brand/20',
          isActive && 'text-brand bg-brand/30'
        )}
      >
        W
      </div>
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
