import { FolderClosed, FolderOpen, Loader2 } from 'lucide-react'
import { ComponentProps, ReactNode } from 'react'
import { cn, CollapsibleTrigger } from 'ui'

import {
  SQL_EDITOR_NAV_FOLDER_ICON_CLASSNAME,
  SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME,
  SQL_EDITOR_NAV_ITEM_ICON_CLASSNAME,
  SQL_EDITOR_NAV_ITEM_TEXT_CLASSNAME,
} from './SQLEditorNav.constants'

export function getSqlEditorNavItemPaddingClass(depth: number) {
  if (depth <= 0) return 'pl-2'
  if (depth === 1) return 'pl-5'
  return 'pl-8'
}

export function getSqlEditorNavItemClassName({
  isActive = false,
  isHighlighted = false,
  isPreview = false,
}: {
  isActive?: boolean
  isHighlighted?: boolean
  isPreview?: boolean
} = {}) {
  return cn(
    'flex items-center gap-x-2 rounded-md pr-2 transition truncate w-full text-left',
    SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME,
    SQL_EDITOR_NAV_ITEM_TEXT_CLASSNAME,
    isActive || isHighlighted
      ? 'bg-selection text-foreground'
      : 'text-foreground-light hover:bg-surface-100 hover:text-foreground',
    isPreview && 'italic font-light'
  )
}

export interface SqlEditorNavItemProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: ReactNode
  label: ReactNode
  depth?: number
  isActive?: boolean
  isHighlighted?: boolean
  isPreview?: boolean
}

export function getSqlEditorNavFolderTriggerClassName(depth = 0, className?: string) {
  return cn(getSqlEditorNavItemClassName(), getSqlEditorNavItemPaddingClass(depth), className)
}

export interface SqlEditorNavFolderTriggerProps extends ComponentProps<typeof CollapsibleTrigger> {
  depth?: number
  open: boolean
  label: ReactNode
  isLoading?: boolean
}

export function SqlEditorNavFolderTrigger({
  depth = 0,
  open,
  label,
  isLoading = false,
  className,
  ...props
}: SqlEditorNavFolderTriggerProps) {
  return (
    <CollapsibleTrigger
      className={getSqlEditorNavFolderTriggerClassName(depth, cn('min-w-0 flex-1', className))}
      {...props}
    >
      {isLoading ? (
        <Loader2
          className={cn(SQL_EDITOR_NAV_FOLDER_ICON_CLASSNAME, 'animate-spin')}
          size={14}
          strokeWidth={1.5}
        />
      ) : (
        <>
          <FolderClosed
            size={14}
            strokeWidth={1.5}
            className={cn(SQL_EDITOR_NAV_FOLDER_ICON_CLASSNAME, open && 'hidden')}
          />
          <FolderOpen
            size={14}
            strokeWidth={1.5}
            className={cn(SQL_EDITOR_NAV_FOLDER_ICON_CLASSNAME, !open && 'hidden')}
          />
        </>
      )}
      <span className="min-w-0 truncate">{label}</span>
    </CollapsibleTrigger>
  )
}

export function SqlEditorNavItem({
  icon,
  label,
  depth = 0,
  isActive,
  isHighlighted,
  isPreview,
  className,
  type = 'button',
  ...props
}: SqlEditorNavItemProps) {
  return (
    <button
      type={type}
      className={cn(
        getSqlEditorNavItemClassName({ isActive, isHighlighted, isPreview }),
        getSqlEditorNavItemPaddingClass(depth),
        className
      )}
      {...props}
    >
      <span className={SQL_EDITOR_NAV_ITEM_ICON_CLASSNAME}>{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  )
}
