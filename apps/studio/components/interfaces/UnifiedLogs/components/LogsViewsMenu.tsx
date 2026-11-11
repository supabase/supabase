import {
  AlertCircleIcon,
  BookmarkIcon,
  EditIcon,
  LayersIcon,
  Loader2Icon,
  Trash2Icon,
} from 'lucide-react'
import { KeyboardEvent, useState } from 'react'
import {
  Button,
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
  hasActiveFilters: boolean
  onApply: (view: LogsView) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onSaveCurrentView: () => void
  onUpdateActiveView: () => void
}

const LogsViewRow = ({
  view,
  isActive,
  isModified,
  onApply,
  onRename,
  onRequestDelete,
  onUpdateActive,
}: {
  view: LogsView
  isActive: boolean
  isModified: boolean
  onApply: (view: LogsView) => void
  onRename: (id: string, name: string) => void
  onRequestDelete: (id: string) => void
  onUpdateActive: () => void
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
        {isActive && isModified && (
          <span className="ml-2 text-foreground-lighter text-xs shrink-0">(modified)</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isActive && isModified && (
          <Button
            variant="text"
            size="tiny"
            className="px-1.5"
            onClick={(e) => {
              e.stopPropagation()
              onUpdateActive()
            }}
          >
            Update
          </Button>
        )}
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
  isActiveViewModified,
  hasActiveFilters,
  onApply,
  onRename,
  onDelete,
  onSaveCurrentView,
  onUpdateActiveView,
}: LogsViewsMenuProps) => {
  const [deleteTarget, setDeleteTarget] = useState<LogsView | null>(null)
  const isViewActive = activeViewId !== null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonTooltip
            size="tiny"
            className={cn('w-[26px]', isViewActive && 'bg-brand-default/10')}
            icon={<BookmarkIcon className={isViewActive ? 'text-brand-600' : 'text-foreground'} />}
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
                isModified={isActiveViewModified}
                onApply={onApply}
                onRename={onRename}
                onRequestDelete={(id) => setDeleteTarget(views.find((v) => v.id === id) ?? null)}
                onUpdateActive={onUpdateActiveView}
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
