import {
  AlertCircleIcon,
  BookmarkIcon,
  EditIcon,
  LayersIcon,
  Loader2Icon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { KeyboardEvent, useRef, useState } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { type LogsView } from '../UnifiedLogs.views'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface LogsViewsMenuProps {
  views: LogsView[]
  isLoading: boolean
  isError: boolean
  isPending?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  onRetry?: () => void
  activeViewId: string | null
  onApply: (view: LogsView) => void
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClearActiveView: () => void
}

// Plain icon triggers (not the full `Button` component, which has a fixed tiny
// height) so these rows stay the same height as a text-only item like "Clear all
// views" — `Button size="tiny"` would make every row taller than that.
const RowIconAction = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  disabled?: boolean
  icon: React.ReactNode
  label: string
  onClick: (e: React.MouseEvent) => void
}) => (
  <button
    type="button"
    disabled={disabled}
    tabIndex={0}
    aria-label={label}
    onClick={onClick}
    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-foreground-light hover:text-foreground hover:bg-overlay-hover"
  >
    {icon}
  </button>
)

const LogsViewRow = ({
  view,
  isActive,
  onApply,
  onRename,
  onRequestDelete,
  canUpdate,
  canDelete,
}: {
  view: LogsView
  canUpdate: boolean
  canDelete: boolean
  isActive: boolean
  onApply: (view: LogsView) => void
  onRename: (id: string, name: string) => Promise<void>
  onRequestDelete: (id: string) => void
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState(view.name)
  const isSavingName = useRef(false)

  const saveName = async () => {
    if (isSavingName.current) return
    isSavingName.current = true
    const trimmed = name.trim()
    try {
      if (trimmed && trimmed !== view.name) await onRename(view.id, trimmed)
      setIsEditingName(false)
    } catch {
      return
    } finally {
      isSavingName.current = false
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Radix's DropdownMenuContent runs typeahead search on any character keydown
    // bubbling up from within it, stealing focus to a matching item — stop every
    // keystroke here so typing in the input isn't hijacked.
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      setName(view.name)
      setIsEditingName(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      saveName()
    }
  }

  if (isEditingName) {
    return (
      <DropdownMenuItem className="justify-between gap-2" onSelect={(e) => e.preventDefault()}>
        <Input
          autoFocus
          size="tiny"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveName}
          // The DropdownMenuItem wrapping this input re-focuses itself (stealing
          // focus from the input) whenever the pointer moves over it — Radix's
          // hover-to-focus behavior for keyboard roving tabindex. Stop these from
          // reaching it so the input keeps focus while the mouse is over the row.
          onPointerMove={(e) => e.stopPropagation()}
          className="w-full"
        />
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem
      className={cn('group justify-between gap-2', isActive && 'bg-foreground-lighter/10')}
      onSelect={() => onApply(view)}
    >
      <div className="flex items-center min-w-0">
        <LayersIcon size={14} className="mr-2 shrink-0 text-foreground-light" />
        <span className={cn('truncate', isActive && 'font-medium')}>{view.name}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <RowIconAction
          icon={<EditIcon size={12} />}
          disabled={!canUpdate}
          label={`Rename ${view.name}`}
          onClick={(e) => {
            e.stopPropagation()
            setIsEditingName(true)
          }}
        />
        <RowIconAction
          icon={<Trash2Icon size={12} />}
          disabled={!canDelete}
          label={`Delete ${view.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onRequestDelete(view.id)
          }}
        />
      </div>
    </DropdownMenuItem>
  )
}

export const LogsViewsMenu = ({
  views,
  isLoading,
  isError,
  activeViewId,
  isPending = false,
  canUpdate = true,
  canDelete = true,
  onRetry,
  onApply,
  onRename,
  onDelete,
  onClearActiveView,
}: LogsViewsMenuProps) => {
  const [deleteTarget, setDeleteTarget] = useState<LogsView | null>(null)
  const isViewActive = activeViewId !== null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonTooltip
            size="tiny"
            variant={isViewActive ? 'primary' : 'default'}
            className="w-[26px]"
            icon={<BookmarkIcon className={!isViewActive ? 'text-foreground' : undefined} />}
            aria-label="Saved views"
            tooltip={{ content: { side: 'bottom', text: 'Saved views' } }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-64">
          {isLoading && (
            <DropdownMenuItem disabled className="justify-center">
              <Loader2Icon size={14} className="animate-spin text-foreground-lighter" />
            </DropdownMenuItem>
          )}
          {!isLoading && isError && (
            <DropdownMenuItem onSelect={onRetry} className="text-foreground-light">
              <AlertCircleIcon size={14} className="mr-2" />
              Failed to load views. Retry
            </DropdownMenuItem>
          )}
          {!isLoading && !isError && views.length === 0 && (
            <DropdownMenuItem disabled className="text-foreground-light">
              No saved views yet
            </DropdownMenuItem>
          )}
          {!isLoading &&
            !isError &&
            views.map((view) => (
              <LogsViewRow
                key={view.id}
                view={view}
                isActive={view.id === activeViewId}
                canUpdate={canUpdate && !isPending}
                canDelete={canDelete && !isPending}
                onApply={onApply}
                onRename={onRename}
                onRequestDelete={(id) => setDeleteTarget(views.find((v) => v.id === id) ?? null)}
              />
            ))}
          {isViewActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onClearActiveView}>
                <XIcon size={14} className="mr-2" />
                Clear all views
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationModal
        variant="destructive"
        visible={deleteTarget !== null}
        confirmLabel="Delete view"
        title="Confirm to delete saved view"
        onCancel={() => setDeleteTarget(null)}
        loading={isPending}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await onDelete(deleteTarget.id)
            setDeleteTarget(null)
          } catch {
            return
          }
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete {deleteTarget?.name}?
        </p>
      </ConfirmationModal>
    </>
  )
}
