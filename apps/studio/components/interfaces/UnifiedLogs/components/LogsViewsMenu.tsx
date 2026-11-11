import {
  AlertCircleIcon,
  BookmarkIcon,
  EditIcon,
  LayersIcon,
  Loader2Icon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { KeyboardEvent, useState } from 'react'
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
  activeViewId: string | null
  isActiveViewModified: boolean
  onApply: (view: LogsView) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onClearActiveView: () => void
}

// Plain icon triggers (not the full `Button` component, which has a fixed tiny
// height) so these rows stay the same height as a text-only item like "Clear all
// views" — `Button size="tiny"` would make every row taller than that.
const RowIconAction = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: (e: React.MouseEvent) => void
}) => (
  <button
    type="button"
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
}: {
  view: LogsView
  isActive: boolean
  onApply: (view: LogsView) => void
  onRename: (id: string, name: string) => void
  onRequestDelete: (id: string) => void
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState(view.name)

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== view.name) onRename(view.id, trimmed)
    setIsEditingName(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setName(view.name)
      setIsEditingName(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
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
          label={`Rename ${view.name}`}
          onClick={(e) => {
            e.stopPropagation()
            setIsEditingName(true)
          }}
        />
        <RowIconAction
          icon={<Trash2Icon size={12} />}
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
  isActiveViewModified,
  onApply,
  onRename,
  onDelete,
  onClearActiveView,
}: LogsViewsMenuProps) => {
  const [deleteTarget, setDeleteTarget] = useState<LogsView | null>(null)
  const isViewActive = activeViewId !== null
  const isViewWarning = isViewActive && isActiveViewModified

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonTooltip
            size="tiny"
            className={cn(
              'w-[26px]',
              isViewWarning ? 'bg-warning/10' : isViewActive && 'bg-brand-default/10'
            )}
            icon={
              <BookmarkIcon
                className={
                  isViewWarning
                    ? 'text-warning-600'
                    : isViewActive
                      ? 'text-brand-600'
                      : 'text-foreground'
                }
              />
            }
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
            <DropdownMenuItem disabled className="text-foreground-light">
              <AlertCircleIcon size={14} className="mr-2" />
              Failed to load views
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
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget.id)
          setDeleteTarget(null)
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete {deleteTarget?.name}?
        </p>
      </ConfirmationModal>
    </>
  )
}
