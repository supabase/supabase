import { PermissionAction } from '@supabase/shared-types/out/constants'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useBucketTrashDeleteMutation,
  useBucketTrashRestoreMutation,
  useTrashCurrentVersionDeleteMutation,
  useTrashVersionDeleteMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

import { useDeletedFilesContext } from './DeletedFilesContext'
import { splitDeletedSelection } from './DeletedFilesList.utils'
import { pageChromeRowClassName } from './storageExplorerChrome'

export const DeletedFilesHeaderSelection = () => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { selectedDeletedIds, clearDeletedSelection, setSelectedDeletedFile } =
    useDeletedFilesContext()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const count = selectedDeletedIds.length

  // Restoring un-archives the whole group a selected row belongs to, whether
  // that row is a top-level file or one version nested under it — so a
  // bulk restore only ever needs the deduplicated set of parent object ids.
  const { mutateAsync: restoreObjects, isPending: isRestoring } = useBucketTrashRestoreMutation()

  // Deleting permanently is the one bulk action where a selected row's kind
  // matters: a top-level selection removes the whole group, while a nested
  // version selection removes just that version — routed to a different
  // mutation depending on whether it's the version that was current at
  // archive time (`versionId === objectId`, the synthetic row's stand-in id;
  // see `getMergedArchivedVersions`) or a genuine noncurrent version.
  const { mutateAsync: deleteObjects, isPending: isDeletingObjects } =
    useBucketTrashDeleteMutation()
  const { mutateAsync: deleteCurrentVersion, isPending: isDeletingCurrentVersion } =
    useTrashCurrentVersionDeleteMutation()
  const { mutateAsync: deleteVersion, isPending: isDeletingVersion } =
    useTrashVersionDeleteMutation()
  const isDeleting = isDeletingObjects || isDeletingCurrentVersion || isDeletingVersion

  const handleRestore = async () => {
    if (!projectRef || !selectedBucket?.id) return
    const { objectIds, versions } = splitDeletedSelection(selectedDeletedIds)
    const allObjectIds = Array.from(new Set([...objectIds, ...versions.map((v) => v.objectId)]))
    if (allObjectIds.length === 0) return

    await restoreObjects({ projectRef, bucketId: selectedBucket.id, objectIds: allObjectIds })
    toast.success(`Restored ${allObjectIds.length} file${allObjectIds.length !== 1 ? 's' : ''}`)
    clearDeletedSelection()
    setSelectedDeletedFile(undefined)
  }

  const handleDelete = async () => {
    if (!projectRef || !selectedBucket?.id) return
    const bucketId = selectedBucket.id
    const { objectIds, versions } = splitDeletedSelection(selectedDeletedIds)
    const currentVersionObjectIds = versions
      .filter((v) => v.versionId === v.objectId)
      .map((v) => v.objectId)
    const genuineVersions = versions.filter((v) => v.versionId !== v.objectId)

    await Promise.all([
      ...(objectIds.length > 0 ? [deleteObjects({ projectRef, bucketId, objectIds })] : []),
      ...currentVersionObjectIds.map((objectId) =>
        deleteCurrentVersion({ projectRef, bucketId, objectId })
      ),
      ...genuineVersions.map(({ objectId, versionId }) =>
        deleteVersion({ projectRef, bucketId, objectId, versionId })
      ),
    ])

    toast.success(`Permanently deleted ${count} item${count !== 1 ? 's' : ''}`)
    setShowDeleteConfirm(false)
    clearDeletedSelection()
    setSelectedDeletedFile(undefined)
  }

  return (
    <>
      <div className="border-b border-overlay bg-surface-200">
        <div className="overflow-x-auto">
          <div className={pageChromeRowClassName}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="font-mono text-xs text-foreground-light">
                <span className="tabular-nums">{count}</span> item{count !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
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
                variant="danger"
                size="tiny"
                icon={<Trash2 size={12} />}
                disabled={!canUpdateFiles}
                onClick={() => setShowDeleteConfirm(true)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canUpdateFiles
                      ? 'You need additional permissions to delete files'
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
                onClick={clearDeletedSelection}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        variant="destructive"
        visible={showDeleteConfirm}
        title={`Permanently delete ${count} item${count !== 1 ? 's' : ''}`}
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-foreground-light">
          {count} item{count !== 1 ? 's' : ''} will be permanently deleted and can no longer be
          restored. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
