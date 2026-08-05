import { Eye, MessageSquare, NotebookPen, ScrollText, Table2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, SQL_ICON } from 'ui'

import type { TabKind } from './kinds'

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

interface KindIconProps {
  // Structurally compatible with `Tab` (`state/tabs.tsx`) without importing it, keeping this module a leaf (ui + lucide-react + `TabKind` only).
  tab: { metadata?: { sqlSource?: 'database' | 'logs' } }
  size?: number
  strokeWidth?: number
  isActive?: boolean
}

type KindIconComponent = (props: KindIconProps) => ReactNode

const SqlKindIcon = ({ tab, size = 15, strokeWidth = 1.5 }: KindIconProps) => {
  if (tab.metadata?.sqlSource === 'logs') {
    return (
      <LogsSnippetIcon
        size={size}
        strokeWidth={strokeWidth}
        className="text-foreground-muted group-aria-selected:text-foreground w-4 h-4 -ml-0.5"
      />
    )
  }

  return (
    <SQL_ICON
      size={size}
      strokeWidth={strokeWidth}
      className="transition-colors fill-foreground-muted group-aria-selected:fill-foreground w-4 h-4 -ml-0.5"
    />
  )
}

const TableKindIcon = ({ size = 15, strokeWidth = 1.5, isActive }: KindIconProps) => (
  <Table2
    size={size}
    strokeWidth={strokeWidth}
    className={cn(
      'text-foreground-muted group-hover:text-foreground-lighter group-aria-selected:text-foreground transition-colors',
      isActive && 'text-foreground-light'
    )}
  />
)

const ViewKindIcon = ({ size = 15, strokeWidth = 1.5, isActive }: KindIconProps) => (
  <Eye
    size={size}
    strokeWidth={strokeWidth}
    className={cn(
      'text-foreground-muted group-hover:text-foreground-lighter transition-colors',
      isActive && 'text-foreground-lighter'
    )}
  />
)

const badgeKindIcon = (letter: string, colorClassName: string): KindIconComponent =>
  function BadgeKindIcon() {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-xs h-4 w-4 rounded-[2px] font-bold',
          colorClassName
        )}
      >
        {letter}
      </div>
    )
  }

const MaterializedViewKindIcon = badgeKindIcon('M', 'text-purple-1100 bg-purple-500')
const ForeignTableKindIcon = badgeKindIcon(
  'F',
  'text-warning-600/80 dark:text-yellow-900 bg-yellow-500'
)
const PartitionedTableKindIcon = badgeKindIcon(
  'P',
  'text-foreground-light bg-surface-400 dark:bg-border-stronger'
)

const NotebookKindIcon = ({ size = 15, strokeWidth = 1.5 }: KindIconProps) => (
  <NotebookPen size={size} strokeWidth={strokeWidth} />
)

const ChatKindIcon = ({ size = 15, strokeWidth = 1.5 }: KindIconProps) => (
  <MessageSquare size={size} strokeWidth={strokeWidth} />
)

/** Per-kind icon, keyed identically to `TAB_KINDS` — see `kinds.ts` for the descriptor table. */
export const TAB_KIND_ICONS: Record<TabKind, KindIconComponent> = {
  sql: SqlKindIcon,
  notebook: NotebookKindIcon,
  chat: ChatKindIcon,
  r: TableKindIcon,
  v: ViewKindIcon,
  m: MaterializedViewKindIcon,
  f: ForeignTableKindIcon,
  p: PartitionedTableKindIcon,
}
