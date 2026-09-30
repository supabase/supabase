import { MessageSquare, NotebookText, Trash } from 'lucide-react'
import Link from 'next/link'
import { type CSSProperties } from 'react'
import { cn, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from 'ui'

import { rowClassName } from './ExplorerLayout.constants'

interface ExplorerNavItemProps {
  href: string
  type: 'notebook' | 'chat'
  name: string
  description?: string
  isActive?: boolean
  style?: CSSProperties
  onDoubleClick: () => void
  onSelectDelete: () => void
}

export const ExplorerNavItem = ({
  href,
  type,
  name,
  description,
  isActive = false,
  style,
  onDoubleClick,
  onSelectDelete,
}: ExplorerNavItemProps) => {
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <Link
          href={href}
          className={rowClassName(isActive)}
          style={style}
          onDoubleClick={onDoubleClick}
        >
          {type === 'notebook' ? (
            <NotebookText size={14} className={cn('shrink-0', isActive && 'text-foreground')} />
          ) : (
            <MessageSquare size={14} className={cn('shrink-0', isActive && 'text-foreground')} />
          )}
          <span className="flex-1 truncate text-left">{name}</span>
          {!!description && (
            <span className="shrink-0 text-xs text-foreground-lighter">{description}</span>
          )}
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem className="gap-x-2" onSelect={onSelectDelete}>
          <Trash size={14} />
          <span>Delete {type}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
