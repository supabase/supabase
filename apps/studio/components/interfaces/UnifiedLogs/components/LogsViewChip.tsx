import { EditIcon, Layers2Icon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react'
import { cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

import { type LogsView } from '../UnifiedLogs.views'

export const CHIP_CLASS =
  'relative flex items-stretch shrink-0 h-[26px] rounded-sm border bg-muted text-xs leading-4'

export const ChipLabelButton = ({
  children,
  isActive,
  onClick,
  title,
  className,
}: {
  children: React.ReactNode
  isActive: boolean
  onClick: () => void
  title?: string
  className?: string
}) => (
  <button
    type="button"
    tabIndex={0}
    title={title}
    aria-current={isActive ? 'true' : undefined}
    onClick={onClick}
    className={cn(
      'flex items-center gap-1.5 px-2 min-w-0 rounded-sm text-foreground-light hover:text-foreground focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring',
      isActive && 'text-foreground font-medium',
      className
    )}
  >
    {children}
  </button>
)

export const LogsViewChip = ({
  view,
  isActive,
  isModified = false,
  isReviewOpen = false,
  canUpdate,
  canDelete,
  rootRef,
  onApply,
  onReviewChanges,
  onRequestRename,
  onRequestDelete,
}: {
  view: LogsView
  isActive: boolean
  isModified?: boolean
  isReviewOpen?: boolean
  canUpdate: boolean
  canDelete: boolean
  rootRef?: React.Ref<HTMLDivElement>
  onApply: (view: LogsView) => void
  onReviewChanges?: () => void
  onRequestRename: (view: LogsView) => void
  onRequestDelete: (view: LogsView) => void
}) => {
  const hasMenu = canUpdate || canDelete

  return (
    <div
      ref={rootRef}
      className={cn(CHIP_CLASS, isActive && 'border-strong bg-surface-200')}
      data-testid={`logs-view-chip-${view.id}`}
    >
      <ChipLabelButton
        isActive={isActive}
        title={view.name}
        onClick={() => onApply(view)}
        className="max-w-[180px]"
      >
        <Layers2Icon size={12} className="shrink-0 text-foreground-light" />
        <span className="truncate">{view.name}</span>
      </ChipLabelButton>

      {isModified && !!onReviewChanges && (
        <button
          type="button"
          tabIndex={0}
          aria-label={`Review changes to ${view.name}`}
          aria-expanded={isReviewOpen}
          onClick={onReviewChanges}
          className="h-[18px] w-[18px] shrink-0 self-center rounded-sm p-0 flex items-center justify-center hover:bg-surface-600 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        </button>
      )}

      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              tabIndex={0}
              aria-label={`Actions for ${view.name}`}
              className="h-[18px] w-[18px] shrink-0 self-center m-[3px] rounded-sm p-0 flex items-center justify-center text-foreground-lighter hover:text-foreground hover:bg-surface-600 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontalIcon size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" sideOffset={8} className="w-40">
            {canUpdate && (
              <DropdownMenuItem onSelect={() => onRequestRename(view)}>
                <EditIcon size={14} className="mr-2" />
                Rename
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem onSelect={() => onRequestDelete(view)}>
                <Trash2Icon size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
