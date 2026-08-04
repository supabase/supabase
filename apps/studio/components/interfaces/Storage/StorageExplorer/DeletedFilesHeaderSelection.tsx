import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useBucketTrashDeleteMutation,
  useBucketTrashQuery,
  useBucketTrashRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

import { useDeletedFilesContext } from './DeletedFilesContext'
import { pageChromeRowClassName } from './storageExplorerChrome'

export const DeletedFilesHeaderSelection = () => {
  const { ref } = useParams()
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { selectedDeletedIds, clearDeletedSelection, setSelectedDeletedFile } =
    useDeletedFilesContext()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const { data: objects } = useBucketTrashQuery({
    projectRef: ref,
    bucketId: selectedBucket.name,
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const selectedObjects = (objects ?? []).filter((o) => selectedDeletedIds.includes(o.id))
  const heldCount = selectedObjects.filter((o) => o.heldBySnapshot).length
  const isEveryItemHeld = heldCount === selectedDeletedIds.length
  const count = selectedDeletedIds.length

  const { mutate: restoreObjects, isPending: isRestoring } = useBucketTrashRestoreMutation({
    onSuccess: () => {
      toast.success(`Restored ${count} file${count !== 1 ? 's' : ''}`)
      clearDeletedSelection()
      setSelectedDeletedFile(undefined)
    },
  })

  const { mutate: deleteObjects, isPending: isDeleting } = useBucketTrashDeleteMutation({
    onSuccess: () => {
      toast.success(`Permanently deleted ${count} file${count !== 1 ? 's' : ''}`)
      setShowDeleteConfirm(false)
      clearDeletedSelection()
      setSelectedDeletedFile(undefined)
    },
  })

  const handleRestore = () => {
    if (!projectRef || !selectedBucket?.id) return
    restoreObjects({ projectRef, bucketId: selectedBucket.id, objectIds: selectedDeletedIds })
  }

  const handleDelete = () => {
    if (!projectRef || !selectedBucket?.id) return
    const deletableIds = selectedObjects.filter((o) => !o.heldBySnapshot).map((o) => o.id)
    deleteObjects({ projectRef, bucketId: selectedBucket.id, objectIds: deletableIds })
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
              {heldCount > 0 && (
                <span className="text-xs text-foreground-lighter">
                  {heldCount} held by a snapshot
                </span>
              )}
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
                onClick={clearDeletedSelection}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        variant="destructive"
        visible={showDeleteConfirm}
        title={`Permanently delete ${count} file${count !== 1 ? 's' : ''}`}
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-foreground-light">
          {count} file{count !== 1 ? 's' : ''} will be permanently deleted and can no longer be
          restored. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
