import { AlertCircleIcon, EditIcon, Layers2Icon, MoreVerticalIcon, Trash2Icon } from 'lucide-react'
import { RefObject, useState } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { type LogsView } from '../UnifiedLogs.views'
import { ViewNameDialog } from './ViewNameDialog'

interface LogsViewRowProps {
  view: LogsView
  isActive: boolean
  isModified: boolean
  canUpdate: boolean
  canDelete: boolean
  activeRowRef?: RefObject<HTMLDivElement | null>
  onApply: (view: LogsView) => void
  onReviewChanges: () => void
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
  onReviewChanges,
  onRequestRename,
  onRequestDelete,
}: LogsViewRowProps) => {
  // Re-applying a modified view would silently throw the edits away, so the row
  // offers the update/save/reset choices instead while it reads as modified.
  const isModifiedActive = isActive && isModified

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
        onClick={() => (isModifiedActive ? onReviewChanges() : onApply(view))}
        aria-current={isActive}
        aria-label={isModifiedActive ? `${view.name} — review changes` : undefined}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 text-left focus-ring"
      >
        <Layers2Icon size={14} className="shrink-0 text-foreground-light" />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm',
            isActive ? 'text-foreground' : 'text-foreground-light'
          )}
          title={view.name}
        >
          {view.name}
        </span>
        {isModifiedActive && (
          <span className="shrink-0 text-xs text-foreground-lighter">Modified</span>
        )}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="tiny"
            variant="text"
            className="px-1 opacity-0 transition-opacity data-[state=open]:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
            icon={<MoreVerticalIcon size={14} />}
            aria-label={`View options for ${view.name}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            disabled={!canUpdate}
            className="gap-x-2"
            onSelect={() => onRequestRename(view)}
          >
            <EditIcon size={14} />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canDelete}
            className="gap-x-2"
            onSelect={() => onRequestDelete(view)}
          >
            <Trash2Icon size={14} />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
  /** Clicking the active view while it reads as modified. */
  onReviewChanges: () => void
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
  onReviewChanges,
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
          <div className="px-3 pt-3">
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

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
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
              icon={Layers2Icon}
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
                  onReviewChanges={onReviewChanges}
                  onRequestRename={setRenameTarget}
                  onRequestDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ViewNameDialog
        open={isSaving}
        title="Save view"
        confirmLabel="Save view"
        existingNames={existingNames}
        discardDescription="Are you sure you want to discard this name? The view won't be saved."
        onCancel={onCancelSave}
        onSubmit={onSubmitSave}
      />

      <ViewNameDialog
        open={renameTarget !== null}
        title="Rename view"
        confirmLabel="Rename view"
        initialName={renameTarget?.name}
        existingNames={existingNames.filter((name) => name !== renameTarget?.name)}
        discardDescription="Are you sure you want to discard your changes? The view will keep its current name."
        onCancel={() => setRenameTarget(null)}
        onSubmit={async (name) => {
          if (!renameTarget) return
          await onRename(renameTarget.id, name)
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
