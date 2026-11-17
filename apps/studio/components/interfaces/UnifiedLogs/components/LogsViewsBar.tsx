import { AlertCircleIcon, Loader2Icon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { type LogsView } from '../UnifiedLogs.views'
import { CHIP_CLASS, LogsViewChip } from './LogsViewChip'
import { MIN_FILTERS_TO_SAVE } from './LogsViews.utils'
import { RenameViewDialog } from './RenameViewDialog'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface LogsViewsBarProps {
  views: LogsView[]
  isLoading: boolean
  isError: boolean
  activeViewId: string | null
  activeFilterCount?: number
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  isPending?: boolean
  isActiveViewModified?: boolean
  isReviewOpen?: boolean
  activeChipRef?: React.Ref<HTMLDivElement>
  onReviewChanges?: () => void
  onApply: (view: LogsView) => void
  onClearActiveView: () => void
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSaveCurrentView?: () => void
  onRetry?: () => void
  id?: string
}

export const LogsViewsBar = ({
  views,
  isLoading,
  isError,
  activeViewId,
  activeFilterCount = 0,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  isPending = false,
  isActiveViewModified = false,
  isReviewOpen = false,
  activeChipRef,
  onReviewChanges,
  onApply,
  onClearActiveView,
  onRename,
  onDelete,
  onSaveCurrentView,
  onRetry,
  id,
}: LogsViewsBarProps) => {
  const [deleteTarget, setDeleteTarget] = useState<LogsView | null>(null)
  const [renameTarget, setRenameTarget] = useState<LogsView | null>(null)

  const isEmpty = !isLoading && !isError && views.length === 0
  const hasFiltersToSave = activeFilterCount >= MIN_FILTERS_TO_SAVE
  const canSaveCurrentFilters = canCreate && hasFiltersToSave
  const saveDisabledReason = !canCreate
    ? "You don't have permission to save views"
    : 'Add a filter to save a view'

  const saveAction = !!onSaveCurrentView && (
    <ButtonTooltip
      type="button"
      size="tiny"
      variant="text"
      className="shrink-0 px-1.5"
      icon={<PlusIcon />}
      aria-label="Save current filters as a view"
      disabled={!canSaveCurrentFilters}
      onClick={onSaveCurrentView}
      tooltip={{
        content: {
          side: 'bottom',
          text: canSaveCurrentFilters ? 'Save current filters as a view' : saveDisabledReason,
        },
      }}
    />
  )

  return (
    <>
      <div
        id={id}
        className="flex items-center gap-1.5 px-2 py-2 border-b overflow-x-auto hide-scrollbar"
      >
        {isLoading && (
          <div className={cn(CHIP_CLASS, 'items-center px-2')}>
            <Loader2Icon size={12} className="animate-spin text-foreground-lighter" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex items-center gap-2 text-xs text-foreground-light">
            <AlertCircleIcon size={12} className="shrink-0" />
            Failed to load views
            <Button size="tiny" variant="text" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}

        {isEmpty && (
          <div className="flex items-center gap-1.5 text-xs text-foreground-lighter whitespace-nowrap px-2">
            <span>No saved views yet. Set some filters, then press</span>
            {saveAction}
            <span>to save them.</span>
          </div>
        )}

        {!isLoading &&
          !isError &&
          views.map((view) => (
            <LogsViewChip
              key={view.id}
              view={view}
              isActive={view.id === activeViewId}
              isModified={view.id === activeViewId && isActiveViewModified}
              isReviewOpen={isReviewOpen}
              rootRef={view.id === activeViewId ? activeChipRef : undefined}
              canUpdate={canUpdate && !isPending}
              canDelete={canDelete && !isPending}
              onApply={onApply}
              onReviewChanges={onReviewChanges}
              onRequestRename={setRenameTarget}
              onRequestDelete={setDeleteTarget}
            />
          ))}

        {!isEmpty && (
          <>
            {saveAction}
            {activeViewId !== null && (
              <Button
                size="tiny"
                variant="text"
                className="shrink-0 ml-auto text-foreground-lighter hover:text-foreground"
                onClick={onClearActiveView}
              >
                Clear view
              </Button>
            )}
          </>
        )}
      </div>

      <RenameViewDialog
        view={renameTarget}
        onCancel={() => setRenameTarget(null)}
        onRename={onRename}
      />

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
          {`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This will remove it for everyone in the project.`}
        </p>
      </ConfirmationModal>
    </>
  )
}
