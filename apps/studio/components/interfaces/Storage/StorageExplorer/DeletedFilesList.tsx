import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useBucketTrashDeleteMutation,
  useBucketTrashQuery,
  useBucketTrashRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

import { toggleSelectAll, toggleSelection } from '../Trash/Trash.utils'
import { useDeletedFilesContext } from './DeletedFilesContext'
import { bulkActionBarClassName } from './storageExplorerChrome'

interface DeletedFilesListProps {
  bucketId: string
  searchString: string
}

export const DeletedFilesList = ({ bucketId, searchString }: DeletedFilesListProps) => {
  const { ref } = useParams()
  const {
    selectedDeletedFile,
    setSelectedDeletedFile,
    selectedDeletedIds,
    setSelectedDeletedIds,
    lastToggledId,
    setLastToggledId,
    clearDeletedSelection,
  } = useDeletedFilesContext()

  const {
    data: objects,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketTrashQuery({ projectRef: ref, bucketId })

  if (isPending) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4">
        <AlertError error={error} subject="Failed to retrieve deleted files" />
      </div>
    )
  }

  const filtered =
    searchString.length > 0
      ? objects.filter((o) => o.name.toLowerCase().includes(searchString.toLowerCase()))
      : objects

  if (isSuccess && filtered.length === 0) {
    return (
      <div className="p-4">
        <Admonition
          type="default"
          title={searchString.length > 0 ? 'No matching deleted files' : 'No deleted files'}
          description={
            searchString.length > 0
              ? 'No deleted files match your search.'
              : 'Deleted objects appear here and can be restored until a lifecycle policy removes them.'
          }
        />
      </div>
    )
  }

  const orderedIds = filtered.map((o) => o.id)
  const hasSelection = selectedDeletedIds.length > 0

  const handleToggle = (id: string, isShiftHeld: boolean) => {
    const newIds = toggleSelection({
      selectedIds: selectedDeletedIds,
      orderedIds,
      id,
      lastToggledId,
      isShiftHeld,
    })
    setSelectedDeletedIds(newIds)
    setLastToggledId(id)
  }

  const handleToggleAll = () => {
    const newIds = toggleSelectAll(selectedDeletedIds, orderedIds)
    setSelectedDeletedIds(newIds)
    setLastToggledId(null)
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {hasSelection && (
        <DeletedFilesSelectionBar
          objects={objects}
          selectedIds={selectedDeletedIds}
          onClear={clearDeletedSelection}
        />
      )}
      <div className="flex items-center gap-3 border-b border-overlay px-4 py-2 bg-surface-100">
        <Checkbox
          checked={
            orderedIds.length > 0 && orderedIds.every((id) => selectedDeletedIds.includes(id))
          }
          onCheckedChange={handleToggleAll}
          aria-label="Select all deleted files"
        />
        <span className="text-xs text-foreground-lighter">
          {hasSelection
            ? `${selectedDeletedIds.length} selected`
            : `${filtered.length} deleted file${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>
      {filtered.map((object) => (
        <DeletedFileRow
          key={object.id}
          object={object}
          isSelected={selectedDeletedFile?.id === object.id}
          isChecked={selectedDeletedIds.includes(object.id)}
          onSelect={() => setSelectedDeletedFile(object)}
          onToggle={(e) => handleToggle(object.id, e.shiftKey)}
        />
      ))}
    </div>
  )
}

interface DeletedFilesSelectionBarProps {
  objects: TrashObject[]
  selectedIds: string[]
  onClear: () => void
}

const DeletedFilesSelectionBar = ({
  objects,
  selectedIds,
  onClear,
}: DeletedFilesSelectionBarProps) => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { clearDeletedSelection, setSelectedDeletedFile } = useDeletedFilesContext()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id))
  const heldCount = selectedObjects.filter((o) => o.heldBySnapshot).length
  const isEveryItemHeld = heldCount === selectedIds.length

  const { mutate: restoreObjects, isPending: isRestoring } = useBucketTrashRestoreMutation({
    onSuccess: () => {
      toast.success(`Restored ${selectedIds.length} file${selectedIds.length !== 1 ? 's' : ''}`)
      clearDeletedSelection()
      setSelectedDeletedFile(undefined)
    },
  })

  const { mutate: deleteObjects, isPending: isDeleting } = useBucketTrashDeleteMutation({
    onSuccess: () => {
      toast.success(
        `Permanently deleted ${selectedIds.length} file${selectedIds.length !== 1 ? 's' : ''}`
      )
      setShowDeleteConfirm(false)
      clearDeletedSelection()
      setSelectedDeletedFile(undefined)
    },
  })

  const handleRestore = () => {
    if (!projectRef || !selectedBucket?.id) return
    restoreObjects({ projectRef, bucketId: selectedBucket.id, objectIds: selectedIds })
  }

  const handleDelete = () => {
    if (!projectRef || !selectedBucket?.id) return
    const deletableIds = selectedObjects.filter((o) => !o.heldBySnapshot).map((o) => o.id)
    deleteObjects({ projectRef, bucketId: selectedBucket.id, objectIds: deletableIds })
  }

  return (
    <>
      <div className={bulkActionBarClassName}>
        <span className="font-mono text-xs text-foreground-light">
          <span className="tabular-nums">{selectedIds.length}</span> item
          {selectedIds.length !== 1 ? 's' : ''} selected
        </span>

        {heldCount > 0 && (
          <span className="text-xs text-foreground-lighter">{heldCount} held by a snapshot</span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <ButtonTooltip
            variant="default"
            size="tiny"
            icon={<RotateCcw size={12} />}
            loading={isRestoring}
            disabled={!canUpdateFiles}
            onClick={handleRestore}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to restore files'
                  : undefined,
              },
            }}
          >
            Restore
          </ButtonTooltip>

          <ButtonTooltip
            variant="default"
            size="tiny"
            icon={<Trash2 size={12} />}
            disabled={!canUpdateFiles || isEveryItemHeld}
            onClick={() => setShowDeleteConfirm(true)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to delete files'
                  : isEveryItemHeld
                    ? 'Every selected file is held by a snapshot'
                    : undefined,
              },
            }}
          >
            Delete permanently
          </ButtonTooltip>

          <Button
            variant="text"
            size="tiny"
            icon={<X size={12} />}
            title="Clear selection"
            className="px-1.5 text-foreground-lighter hover:text-foreground"
            onClick={onClear}
          />
        </div>
      </div>

      <ConfirmationModal
        variant="destructive"
        visible={showDeleteConfirm}
        title={`Permanently delete ${selectedIds.length} file${selectedIds.length !== 1 ? 's' : ''}`}
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-foreground-light">
          {selectedIds.length} file{selectedIds.length !== 1 ? 's' : ''} will be permanently deleted
          and can no longer be restored. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

interface DeletedFileRowProps {
  object: TrashObject
  isSelected: boolean
  isChecked: boolean
  onSelect: () => void
  onToggle: (e: React.MouseEvent) => void
}

const DeletedFileRow = ({
  object,
  isSelected,
  isChecked,
  onSelect,
  onToggle,
}: DeletedFileRowProps) => {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center gap-3 border-b border-overlay px-4 py-2.5 transition-colors cursor-pointer',
        isSelected ? 'bg-surface-200' : 'hover:bg-surface-100'
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect()
      }}
    >
      <Checkbox
        checked={isChecked}
        onClick={(e) => {
          e.stopPropagation()
          onToggle(e)
        }}
        aria-label={`Select ${object.name}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{object.name}</p>
        <p className="text-xs text-foreground-lighter">
          {formatBytes(object.size)} · deleted {dayjs(object.deletedAt).format('MMM D, HH:mm')} ·
          from {object.originalPath}
        </p>
      </div>
      {object.heldBySnapshot && (
        <span className="text-xs text-foreground-lighter shrink-0">held</span>
      )}
    </div>
  )
}
