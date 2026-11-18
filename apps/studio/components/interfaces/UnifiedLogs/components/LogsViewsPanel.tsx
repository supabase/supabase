import { AlertCircleIcon, EditIcon, LayersIcon, Trash2Icon } from 'lucide-react'
import { FormEvent, KeyboardEvent, RefObject, useEffect, useRef, useState } from 'react'
import { Button, cn, Input } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { countActiveFilters, type LogsView } from '../UnifiedLogs.views'
import { isDuplicateViewName, VIEW_NAME_MAX_LENGTH } from './LogsViews.utils'
import { RenameViewDialog } from './RenameViewDialog'

interface LogsViewRowProps {
  view: LogsView
  isActive: boolean
  isModified: boolean
  canUpdate: boolean
  canDelete: boolean
  activeRowRef?: RefObject<HTMLDivElement | null>
  onApply: (view: LogsView) => void
  onRequestRename: (view: LogsView) => void
  onRequestDelete: (view: LogsView) => void
}

const LogsViewRow = ({
  view,
  isActive,
  isModified,
  canUpdate,
  canDelete,
  activeRowRef,
  onApply,
  onRequestRename,
  onRequestDelete,
}: LogsViewRowProps) => {
  const filterCount = countActiveFilters(view)

  return (
    <div
      ref={isActive ? activeRowRef : undefined}
      className={cn(
        'group relative flex w-full items-center gap-2 rounded-md pl-2 pr-1',
        isActive ? 'bg-selection' : 'hover:bg-surface-200'
      )}
    >
      <button
        type="button"
        tabIndex={0}
        onClick={() => onApply(view)}
        aria-current={isActive}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 text-left focus-ring"
      >
        <LayersIcon size={14} className="shrink-0 text-foreground-light" />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-sm',
              isActive ? 'text-foreground' : 'text-foreground-light'
            )}
            title={view.name}
          >
            {view.name}
          </span>
          <span className="block text-xs text-foreground-lighter">
            <span>{filterCount === 1 ? '1 filter' : `${filterCount} filters`}</span>
            {isActive && isModified && <span> · Modified</span>}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <Button
          size="tiny"
          variant="text"
          className="px-1"
          disabled={!canUpdate}
          icon={<EditIcon size={12} />}
          aria-label={`Rename ${view.name}`}
          onClick={() => onRequestRename(view)}
        />
        <Button
          size="tiny"
          variant="text"
          className="px-1"
          disabled={!canDelete}
          icon={<Trash2Icon size={12} />}
          aria-label={`Delete ${view.name}`}
          onClick={() => onRequestDelete(view)}
        />
      </div>
    </div>
  )
}

interface SaveViewRowProps {
  existingNames: string[]
  isPending: boolean
  onCancel: () => void
  onSubmit: (name: string) => Promise<void>
}

const SaveViewRow = ({ existingNames, isPending, onCancel, onSubmit }: SaveViewRowProps) => {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const trimmed = name.trim()
  const isDuplicate = isDuplicateViewName(trimmed, existingNames)
  const isBusy = isPending || isSubmitting
  const canSubmit = trimmed.length > 0 && !isDuplicate && !isBusy

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await onSubmit(trimmed)
    } catch {
      // Leave the form open with the name intact so the user can retry.
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-2 py-2">
      <Input
        ref={inputRef}
        size="tiny"
        value={name}
        maxLength={VIEW_NAME_MAX_LENGTH}
        placeholder="Enter a name for this view"
        aria-label="Name for this view"
        aria-invalid={isDuplicate}
        aria-describedby={isDuplicate ? 'logs-view-name-error' : undefined}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {isDuplicate && (
        <p id="logs-view-name-error" className="text-xs text-destructive-600">
          That name's already taken. Try another.
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button size="tiny" variant="default" onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
        <Button size="tiny" type="submit" loading={isBusy} disabled={!canSubmit}>
          Save
        </Button>
      </div>
    </form>
  )
}

interface LogsViewsPanelProps {
  views: LogsView[]
  isLoading: boolean
  isError: boolean
  isPending?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  activeViewId: string | null
  isActiveViewModified?: boolean
  isSaving?: boolean
  activeRowRef?: RefObject<HTMLDivElement | null>
  onRetry?: () => void
  onApply: (view: LogsView) => void
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCancelSave: () => void
  onSubmitSave: (name: string) => Promise<void>
}

export const LogsViewsPanel = ({
  views,
  isLoading,
  isError,
  isPending = false,
  canUpdate = true,
  canDelete = true,
  activeViewId,
  isActiveViewModified = false,
  isSaving = false,
  activeRowRef,
  onRetry,
  onApply,
  onRename,
  onDelete,
  onCancelSave,
  onSubmitSave,
}: LogsViewsPanelProps) => {
  const [search, setSearch] = useState('')
  const [renameTarget, setRenameTarget] = useState<LogsView | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LogsView | null>(null)

  const matchingViews = views.filter((view) =>
    view.name.toLowerCase().includes(search.trim().toLowerCase())
  )
  const existingNames = views.map((view) => view.name)

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        {views.length > 0 && (
          <div className="px-2 pt-2">
            <InnerSideBarFilters className="w-full gap-0 p-0">
              <InnerSideBarFilterSearchInput
                name="logs-views-search"
                value={search}
                placeholder="Search views"
                aria-labelledby="Search views"
                onChange={(event) => setSearch(event.target.value)}
              />
            </InnerSideBarFilters>
          </div>
        )}

        {isSaving && (
          <SaveViewRow
            existingNames={existingNames}
            isPending={isPending}
            onCancel={onCancelSave}
            onSubmit={onSubmitSave}
          />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {isLoading && <GenericSkeletonLoader />}

          {!isLoading && isError && (
            <div className="flex flex-col items-start gap-2 px-2 py-2">
              <p className="flex items-center gap-2 text-xs text-foreground-light">
                <AlertCircleIcon size={14} className="shrink-0" />
                Failed to load views.
              </p>
              <Button size="tiny" variant="default" onClick={onRetry}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && views.length === 0 && !isSaving && (
            <EmptyStatePresentational
              icon={LayersIcon}
              iconSize={20}
              title="No saved views"
              description="Filter your logs, then save the combination to come back to it later."
              className="border-0 bg-transparent px-2 py-2"
              contentClassName="gap-y-1 [&_h3]:text-sm [&_p]:text-xs"
            />
          )}

          {!isLoading && !isError && views.length > 0 && matchingViews.length === 0 && (
            <p className="px-2 py-2 text-xs text-foreground-lighter">No views found</p>
          )}

          {!isLoading && !isError && matchingViews.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {matchingViews.map((view) => (
                <LogsViewRow
                  key={view.id}
                  view={view}
                  isActive={view.id === activeViewId}
                  isModified={isActiveViewModified}
                  canUpdate={canUpdate && !isPending}
                  canDelete={canDelete && !isPending}
                  activeRowRef={activeRowRef}
                  onApply={onApply}
                  onRequestRename={setRenameTarget}
                  onRequestDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <RenameViewDialog
        view={renameTarget}
        existingNames={existingNames.filter((name) => name !== renameTarget?.name)}
        onCancel={() => setRenameTarget(null)}
        onRename={async (id, name) => {
          await onRename(id, name)
          setRenameTarget(null)
        }}
      />

      <ConfirmationModal
        variant="destructive"
        visible={deleteTarget !== null}
        confirmLabel="Delete view"
        title="Confirm to delete saved view"
        loading={isPending}
        onCancel={() => setDeleteTarget(null)}
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
          Are you sure you want to delete {deleteTarget?.name}? This removes it for everyone in the
          project.
        </p>
      </ConfirmationModal>
    </>
  )
}
