import { GitBranch } from 'lucide-react'
import { cn, SQL_ICON } from 'ui'

import type { SqlSnippetSource } from '@/components/interfaces/SQLEditor/querySource'
import { TAB_KIND_ICONS } from '@/state/tabs/kinds.icons'

interface EntityTypeIconProps {
  type: 'sql' | 'schema' | 'new' | 'r' | 'v' | 'm' | 'f' | 'p'
  size?: number
  strokeWidth?: number
  isActive?: boolean
  sqlSource?: SqlSnippetSource
}

/** Thin wrapper over the per-kind icons in `state/tabs/kinds.icons`, preserving this component's flexible prop-based API for callers without a whole `Tab` to hand. */
export const EntityTypeIcon = ({
  type,
  size = 15,
  strokeWidth = 1.5,
  isActive,
  sqlSource,
}: EntityTypeIconProps) => {
  if (type === 'schema') {
    return <GitBranch size={size} strokeWidth={strokeWidth} />
  }

  if (type === 'new') {
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

  const KindIcon = TAB_KIND_ICONS[type]
  return (
    <KindIcon
      tab={{ metadata: { sqlSource } }}
      size={size}
      strokeWidth={strokeWidth}
      isActive={isActive}
    />
  )
}
