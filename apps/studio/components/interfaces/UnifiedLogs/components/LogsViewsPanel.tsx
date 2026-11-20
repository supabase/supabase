import { AlertCircleIcon } from 'lucide-react'
import { Ref, useState } from 'react'
import { Button } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { type LogsView } from '../UnifiedLogs.views'
import { LogsViewRow } from './LogsViewRow'
import { PRESET_VIEWS } from './LogsViews.presets'
import { ViewNameDialog } from './ViewNameDialog'

interface LogsViewsPanelProps {
  views: LogsView[]
  isLoading: boolean
  isError: boolean
  isPending?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  canCreate?: boolean
  activeViewId: string | null
  isActiveViewModified?: boolean
  isSaving?: boolean
  activeRowRef?: Ref<HTMLDivElement>
  onRetry?: () => void
  onApply: (view: LogsView) => void
  onReviewChanges: () => void
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDuplicate: (view: LogsView, name: string) => Promise<void>
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
  canCreate = true,
  activeViewId,
  isActiveViewModified = false,
  isSaving = false,
  activeRowRef,
  onRetry,
  onApply,
  onReviewChanges,
  onRename,
  onDelete,
  onDuplicate,
  onCancelSave,
  onSubmitSave,
}: LogsViewsPanelProps) => {
  const [search, setSearch] = useState('')
  const [renameTarget, setRenameTarget] = useState<LogsView | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LogsView | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<LogsView | null>(null)

  const matches = (view: LogsView) => view.name.toLowerCase().includes(search.trim().toLowerCase())
  const matchingPresets = PRESET_VIEWS.filter(matches)
  const matchingViews = views.filter(matches)
  const existingNames = [...PRESET_VIEWS, ...views].map((view) => view.name)
  const hasNoMatches = matchingPresets.length === 0 && matchingViews.length === 0

  const getViewsStatusText = () => {
    if (isLoading) return 'Loading views...'
    if (isError) return 'Failed to load views.'
    if (hasNoMatches) return 'No views found'
    const count = matchingPresets.length + matchingViews.length
    return `${count} ${count === 1 ? 'view' : 'views'} found`
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {getViewsStatusText()}
        </span>
        {!isLoading && (
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

          {!isLoading && !isError && hasNoMatches && (
            <p className="px-2 py-2 text-xs text-foreground-lighter">No views found</p>
          )}

          {!isLoading && !isError && matchingPresets.length > 0 && (
            <section aria-labelledby="logs-preset-views-heading" className="flex flex-col gap-0.5">
              <h3
                id="logs-preset-views-heading"
                className="mb-2 px-2 font-mono text-sm font-normal uppercase text-foreground-lighter"
              >
                Preset views
              </h3>
              {matchingPresets.map((view) => (
                <LogsViewRow
                  key={view.id}
                  view={view}
                  isPreset
                  description={view.description}
                  isActive={view.id === activeViewId}
                  isModified={isActiveViewModified}
                  canCreate={canCreate && !isPending}
                  canUpdate={false}
                  canDelete={false}
                  activeRowRef={activeRowRef}
                  onApply={onApply}
                  onReviewChanges={onReviewChanges}
                  onRequestRename={setRenameTarget}
                  onRequestDelete={setDeleteTarget}
                  onRequestDuplicate={setDuplicateTarget}
                />
              ))}
            </section>
          )}

          {!isLoading && !isError && (
            <section aria-labelledby="logs-saved-views-heading" className="flex flex-col gap-0.5">
              <h3
                id="logs-saved-views-heading"
                className="mb-2 mt-4 px-2 font-mono text-sm font-normal uppercase text-foreground-lighter"
              >
                Saved views
              </h3>
              {views.length === 0 ? (
                <p className="px-2 py-1 text-xs text-foreground-lighter">
                  Filter your logs, then save the combination to come back to it later.
                </p>
              ) : (
                matchingViews.map((view) => (
                  <LogsViewRow
                    key={view.id}
                    view={view}
                    isActive={view.id === activeViewId}
                    isModified={isActiveViewModified}
                    canCreate={canCreate && !isPending}
                    canUpdate={canUpdate && !isPending}
                    canDelete={canDelete && !isPending}
                    activeRowRef={activeRowRef}
                    onApply={onApply}
                    onReviewChanges={onReviewChanges}
                    onRequestRename={setRenameTarget}
                    onRequestDelete={setDeleteTarget}
                    onRequestDuplicate={setDuplicateTarget}
                  />
                ))
              )}
            </section>
          )}
        </div>
      </div>

      <ViewNameDialog
        open={duplicateTarget !== null}
        title="Duplicate view"
        confirmLabel="Save view"
        initialName={duplicateTarget ? `${duplicateTarget.name} copy` : undefined}
        existingNames={existingNames}
        discardDescription="Are you sure you want to discard this name? The copy won't be saved."
        onCancel={() => setDuplicateTarget(null)}
        onSubmit={async (name) => {
          if (!duplicateTarget) return
          await onDuplicate(duplicateTarget, name)
          setDuplicateTarget(null)
        }}
      />

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
          if (!renameTarget || name === renameTarget.name) return
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
