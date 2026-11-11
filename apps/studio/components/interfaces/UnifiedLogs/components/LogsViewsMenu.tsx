import { AlertCircleIcon, BookmarkIcon, EditIcon, Loader2Icon, Trash2Icon } from 'lucide-react'
import { KeyboardEvent, useState } from 'react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { countActiveFilters, type LogsView } from '../UnifiedLogs.views'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface LogsViewsMenuProps {
  views: LogsView[]
  isLoading: boolean
  isError: boolean
  activeViewId: string | null
  hasActiveFilters: boolean
  onApply: (view: LogsView) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onSaveCurrentView: () => void
}

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
    <DropdownMenuItem className="group justify-between gap-2" onSelect={() => onApply(view)}>
      <span className={isActive ? 'font-medium truncate' : 'truncate'}>{view.name}</span>
      <div className="flex items-center gap-1 shrink-0">
        <Badge>{countActiveFilters(view)}</Badge>
        <Button
          variant="text"
          size="tiny"
          className="opacity-0 group-hover:opacity-100 px-1"
          icon={<EditIcon size={14} />}
          aria-label={`Rename ${view.name}`}
          onClick={(e) => {
            e.stopPropagation()
            setIsEditingName(true)
          }}
        />
        <Button
          variant="text"
          size="tiny"
          className="opacity-0 group-hover:opacity-100 px-1"
          icon={<Trash2Icon size={14} />}
          aria-label={`Delete ${view.name}`}
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
  hasActiveFilters,
  onApply,
  onRename,
  onDelete,
  onSaveCurrentView,
}: LogsViewsMenuProps) => {
  const [deleteTarget, setDeleteTarget] = useState<LogsView | null>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonTooltip
            size="tiny"
            className="w-[26px]"
            icon={<BookmarkIcon className="text-foreground" />}
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
            <DropdownMenuItem disabled className="gap-2 text-foreground-light">
              <AlertCircleIcon size={14} />
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
          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSaveCurrentView}>
                Save current filters as view
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
