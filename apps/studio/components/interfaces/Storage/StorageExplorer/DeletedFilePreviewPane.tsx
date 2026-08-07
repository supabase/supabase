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
  useTrashVersionDeleteMutation,
  useTrashVersionRestoreMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { type TrashObject } from '@/data/storage/protection/protection-mocks'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { BASE_PATH } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

import { useDeletedFilesContext, type SelectedDeletedVersion } from './DeletedFilesContext'

export const DeletedFilePreviewPane = () => {
  const {
    selectedDeletedFile,
    setSelectedDeletedFile,
    selectedDeletedVersion,
    setSelectedDeletedVersion,
  } = useDeletedFilesContext()

  if (selectedDeletedVersion) {
    return <VersionPreviewPane />
  }

  if (selectedDeletedFile) {
    return <ObjectPreviewPane />
  }

  return null
}

// ── Object-level preview (delete-marker) ──────────────────────────────

const ObjectPreviewPane = () => {
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
        className="absolute inset-y-0 right-0 z-10 flex flex-col border-l border-overlay bg-surface-100 shadow-lg"
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

          <FilePreviewPlaceholder />

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
            {file.noncurrentVersions && file.noncurrentVersions.length > 0 && (
              <DeletedFileDetail
                label="Noncurrent versions"
                value={`${file.noncurrentVersions.length}`}
              />
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
                  ? 'You need additional permissions to restore versions'
                  : undefined,
              },
            }}
          >
            Restore
          </ButtonTooltip>
          <ButtonTooltip
            variant="danger"
            icon={<Trash2 size={14} />}
            disabled={!canUpdateFiles}
            onClick={() => setShowDeleteConfirm(true)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to delete versions'
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

// ── Version-level preview ─────────────────────────────────────────────

const VersionPreviewPane = () => {
  const { selectedDeletedVersion, setSelectedDeletedVersion } = useDeletedFilesContext()
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { mutate: restoreVersion, isPending: isRestoring } = useTrashVersionRestoreMutation({
    onSuccess: () => {
      toast.success(`Version restored`)
      setSelectedDeletedVersion(undefined)
    },
  })

  const { mutate: deleteVersion, isPending: isDeleting } = useTrashVersionDeleteMutation({
    onSuccess: () => {
      toast.success('Version permanently deleted')
      setShowDeleteConfirm(false)
      setSelectedDeletedVersion(undefined)
    },
  })

  if (!selectedDeletedVersion) return null

  const { parentObject, version } = selectedDeletedVersion
  const shortId = version.versionId.slice(0, 8)

  const handleRestore = () => {
    if (!projectRef || !selectedBucket?.id) return
    restoreVersion({
      projectRef,
      bucketId: selectedBucket.id,
      objectId: parentObject.id,
      versionId: version.versionId,
    })
  }

  const handleDeletePermanently = () => {
    if (!projectRef || !selectedBucket?.id) return
    deleteVersion({
      projectRef,
      bucketId: selectedBucket.id,
      objectId: parentObject.id,
      versionId: version.versionId,
    })
  }

  const width = 450

  return (
    <>
      <div
        key={`${parentObject.id}::${version.versionId}`}
        className="absolute inset-y-0 right-0 z-10 flex flex-col border-l border-overlay bg-surface-100 shadow-lg"
        style={{ width }}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex w-full justify-end text-foreground-lighter transition-colors hover:text-foreground">
            <X
              className="cursor-pointer"
              size={14}
              onClick={() => setSelectedDeletedVersion(undefined)}
            />
          </div>

          <div className="my-4 flex h-56 w-full items-center justify-center rounded border border-dashed border-overlay 2xl:h-72">
            <p className="text-sm text-foreground-muted">No preview available for this version</p>
          </div>

          <div className="w-full space-y-3 mt-4">
            <div className="space-y-1">
              <h5 className="wrap-break-word text-base text-foreground">{parentObject.name}</h5>
              <p className="text-sm text-foreground-light">
                Noncurrent version ·{' '}
                <span className="font-mono text-foreground-muted">{shortId}</span>
              </p>
            </div>

            <DeletedFileDetail label="Version ID" value={shortId} />
            <DeletedFileDetail label="Action" value={version.action} />
            <DeletedFileDetail
              label="Created"
              value={dayjs(version.createdAt).format('MMM D, YYYY HH:mm')}
            />
            <DeletedFileDetail label="Size" value={formatBytes(version.size)} />
            <DeletedFileDetail label="Original location" value={parentObject.originalPath} />
            <DeletedFileDetail
              label="Deleted at"
              value={dayjs(parentObject.deletedAt).format('MMM D, YYYY HH:mm')}
            />
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
                  ? 'You need additional permissions to restore versions'
                  : undefined,
              },
            }}
          >
            Restore
          </ButtonTooltip>
          <ButtonTooltip
            variant="danger"
            icon={<Trash2 size={14} />}
            disabled={!canUpdateFiles}
            onClick={() => setShowDeleteConfirm(true)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to delete versions'
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
        title="Permanently delete version"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePermanently}
      >
        <p className="text-sm text-foreground-light">
          Version <span className="font-mono text-foreground">{shortId}</span> of{' '}
          {parentObject.name} will be permanently deleted. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────

const FilePreviewPlaceholder = () => (
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

const DeletedFileDetail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="mb-1 text-xs text-foreground-lighter">{label}</label>
    <p className="text-sm text-foreground-light break-all">{value}</p>
  </div>
)
