import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import SVG from 'react-inlinesvg'
import { toast } from 'sonner'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useBucketTrashDeleteMutation,
  useBucketTrashRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { BASE_PATH } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

import { useDeletedFilesContext } from './DeletedFilesContext'

export const DeletedFilePreviewPane = () => {
  const { selectedDeletedFile: file, setSelectedDeletedFile } = useDeletedFilesContext()
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { mutate: restoreObjects, isPending: isRestoring } = useBucketTrashRestoreMutation({
    onSuccess: () => {
      toast.success(`Restored ${file?.name}`)
      setSelectedDeletedFile(undefined)
    },
  })

  const { mutate: deleteObjects, isPending: isDeleting } = useBucketTrashDeleteMutation({
    onSuccess: () => {
      toast.success('File permanently deleted')
      setShowDeleteConfirm(false)
      setSelectedDeletedFile(undefined)
    },
  })

  if (!file) return null

  const handleRestore = () => {
    if (!projectRef || !selectedBucket?.id) return
    restoreObjects({ projectRef, bucketId: selectedBucket.id, objectIds: [file.id] })
  }

  const handleDeletePermanently = () => {
    if (!projectRef || !selectedBucket?.id) return
    deleteObjects({ projectRef, bucketId: selectedBucket.id, objectIds: [file.id] })
  }

  const width = 450

  return (
    <>
      <div
        key={file.id}
        className="flex h-full flex-col border-l border-overlay bg-surface-100"
        style={{ width }}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex w-full justify-end text-foreground-lighter transition-colors hover:text-foreground">
            <X
              className="cursor-pointer"
              size={14}
              onClick={() => setSelectedDeletedFile(undefined)}
            />
          </div>

          <DeletedFilePreview file={file} />

          <div className="w-full space-y-3 mt-4">
            <div className="space-y-1">
              <h5 className="wrap-break-word text-base text-foreground">{file.name}</h5>
              <p className="text-sm text-foreground-light">{formatBytes(file.size)}</p>
            </div>

            <DeletedFileDetail label="Original location" value={file.originalPath} />
            <DeletedFileDetail
              label="Deleted at"
              value={dayjs(file.deletedAt).format('MMM D, YYYY HH:mm')}
            />
            <DeletedFileDetail label="Deleted by" value={file.deletedBy} />
            <DeletedFileDetail label="Size" value={formatBytes(file.size)} />
            <DeletedFileDetail
              label="Expires"
              value={file.expiresAt ? dayjs(file.expiresAt).format('MMM D, YYYY') : 'Never'}
            />

            {file.heldBySnapshot && (
              <p className="text-xs text-foreground-lighter">
                Held by a snapshot — this file cannot be permanently deleted until the snapshot is
                removed.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-overlay p-4">
          <ButtonTooltip
            variant="default"
            icon={<RotateCcw size={14} />}
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
            icon={<Trash2 size={14} />}
            disabled={!canUpdateFiles || file.heldBySnapshot}
            onClick={() => setShowDeleteConfirm(true)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to delete files'
                  : file.heldBySnapshot
                    ? 'Held by a snapshot — delete the snapshot first'
                    : undefined,
              },
            }}
          >
            Delete permanently
          </ButtonTooltip>
        </div>
      </div>

      <ConfirmationModal
        variant="destructive"
        visible={showDeleteConfirm}
        title="Permanently delete file"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePermanently}
      >
        <p className="text-sm text-foreground-light">
          {file.name} will be permanently deleted and can no longer be restored. This action cannot
          be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

const DeletedFilePreview = ({ file }: { file: TrashObject }) => {
  const mimeType = file.name.match(/\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i)
    ? 'image'
    : file.name.match(/\.(mp4|webm|ogg|mov)$/i)
      ? 'video'
      : file.name.match(/\.(mp3|wav|ogg|aac|flac)$/i)
        ? 'audio'
        : null

  if (!mimeType) {
    return (
      <div className="my-4 border border-overlay">
        <div className="flex h-56 w-full items-center justify-center 2xl:h-72">
          <SVG
            src={`${BASE_PATH}/img/file-filled.svg`}
            preProcessor={(code: string) =>
              code.replace(/svg/, 'svg class="mx-auto w-32 h-32 text-color-inherit opacity-75"')
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="my-4 border border-overlay">
      <div className="flex h-56 w-full items-center justify-center 2xl:h-72">
        <SVG
          src={`${BASE_PATH}/img/file-filled.svg`}
          preProcessor={(code: string) =>
            code.replace(/svg/, 'svg class="mx-auto w-32 h-32 text-color-inherit opacity-75"')
          }
        />
      </div>
    </div>
  )
}

const DeletedFileDetail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="mb-1 text-xs text-foreground-lighter">{label}</label>
    <p className="text-sm text-foreground-light break-all">{value}</p>
  </div>
)
