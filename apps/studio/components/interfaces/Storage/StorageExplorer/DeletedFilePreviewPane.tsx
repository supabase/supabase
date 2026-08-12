import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { MoreVertical, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useBucketTrashDeleteMutation,
  useBucketTrashRestoreMutation,
  useTrashCurrentVersionDeleteMutation,
  useTrashVersionDeleteMutation,
} from '@/data/storage/protection/bucket-trash-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

import { useDeletedFilesContext } from './DeletedFilesContext'
import { getMergedArchivedVersions, type ArchivedVersionRow } from './DeletedFilesList.utils'
import { PreviewSection } from './PreviewPane'
import { VersionThumbnail } from './VersionHistory'

const width = 450

export const DeletedFilePreviewPane = () => {
  const {
    selectedDeletedFile,
    setSelectedDeletedFile,
    selectedDeletedVersion,
    setSelectedDeletedVersion,
  } = useDeletedFilesContext()
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<ArchivedVersionRow>()

  // Restoring any row — the group summary or a specific version — un-archives
  // the whole file; only the toast differs, based on which row triggered it.
  const { mutate: restoreObject, isPending: isRestoring } = useBucketTrashRestoreMutation()

  const { mutate: deleteObject, isPending: isDeleting } = useBucketTrashDeleteMutation({
    onSuccess: () => {
      toast.success('File permanently deleted')
      setShowDeleteConfirm(false)
      setSelectedDeletedFile(undefined)
      setSelectedDeletedVersion(undefined)
    },
  })

  // Permanently deleting one version routes to a different mutation depending
  // on whether it's the version that was current at archive time — see
  // `getMergedArchivedVersions` and `deleteCurrentTrashVersionPermanently`.
  const { mutate: deleteCurrentVersion, isPending: isDeletingCurrentVersion } =
    useTrashCurrentVersionDeleteMutation()
  const { mutate: deleteVersion, isPending: isDeletingVersion } = useTrashVersionDeleteMutation()
  const isDeletingAnyVersion = isDeletingCurrentVersion || isDeletingVersion

  const parentObject = selectedDeletedVersion?.parentObject ?? selectedDeletedFile
  const previewedVersion = selectedDeletedVersion?.version

  if (!parentObject) return null

  const mergedVersions = getMergedArchivedVersions(parentObject)

  const handleClose = () => {
    setSelectedDeletedFile(undefined)
    setSelectedDeletedVersion(undefined)
  }

  const handleRestore = (version?: ArchivedVersionRow) => {
    if (!projectRef || !selectedBucket?.id) return
    restoreObject(
      { projectRef, bucketId: selectedBucket.id, objectIds: [parentObject.id] },
      {
        onSuccess: () => {
          toast.success(
            version && !version.wasCurrentAtArchive
              ? `File restored — version ${version.versionId.slice(0, 8)} is now the current version`
              : 'File restored'
          )
          handleClose()
        },
      }
    )
  }

  const handleDeleteGroup = () => {
    if (!projectRef || !selectedBucket?.id) return
    deleteObject({ projectRef, bucketId: selectedBucket.id, objectIds: [parentObject.id] })
  }

  const handleDeleteVersion = () => {
    if (!projectRef || !selectedBucket?.id || !versionToDelete) return
    const onSuccess = () => {
      toast.success('Version permanently deleted')
      setVersionToDelete(undefined)
      if (previewedVersion?.versionId === versionToDelete.versionId) {
        setSelectedDeletedVersion(undefined)
      }
    }
    if (versionToDelete.wasCurrentAtArchive) {
      deleteCurrentVersion(
        { projectRef, bucketId: selectedBucket.id, objectId: parentObject.id },
        { onSuccess }
      )
    } else {
      deleteVersion(
        {
          projectRef,
          bucketId: selectedBucket.id,
          objectId: parentObject.id,
          versionId: versionToDelete.versionId,
        },
        { onSuccess }
      )
    }
  }

  const handleSelectVersion = (version: ArchivedVersionRow) => {
    // The row for the version that was current at archive time behaves like
    // clicking "Current" in the live version history — it's already what a
    // plain restore produces, so there's no separate widget for it.
    if (version.wasCurrentAtArchive) {
      setSelectedDeletedVersion(undefined)
    } else {
      setSelectedDeletedVersion({ parentObject, version })
    }
  }

  const topSlot = previewedVersion ? (
    <ArchivedVersionRestoreWidget
      version={previewedVersion}
      isRestoring={isRestoring}
      onRestore={() => handleRestore(previewedVersion)}
      onDismiss={() => setSelectedDeletedVersion(undefined)}
    />
  ) : (
    <div className="border-b border-overlay p-3">
      <div
        className="flex items-center justify-center overflow-hidden rounded-md border border-dashed border-overlay"
        style={{ height: 'clamp(120px, calc((100vh - 144px) * 0.4), 180px)' }}
      >
        <p className="px-4 text-center text-sm text-foreground-muted">
          No preview available for archived files
        </p>
      </div>
      <div className="mt-2 flex flex-col">
        <p className="truncate text-sm font-medium text-foreground" title={parentObject.name}>
          {parentObject.name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 truncate text-xs text-foreground-light">
          {formatBytes(parentObject.size)}
          <Badge variant="warning" className="-my-1">
            Archived
          </Badge>
        </p>
        <div className="mt-3 flex items-center gap-x-1 shrink-0">
          <ButtonTooltip
            variant="outline"
            size="tiny"
            icon={<RotateCcw size={14} />}
            loading={isRestoring}
            disabled={!canUpdateFiles}
            onClick={() => handleRestore()}
            tooltip={{
              content: {
                side: 'top',
                text: !canUpdateFiles
                  ? 'You need additional permissions to restore files'
                  : undefined,
              },
            }}
          >
            Restore latest version
          </ButtonTooltip>
          <ButtonTooltip
            variant="outline"
            size="tiny"
            icon={<Trash2 size={14} />}
            disabled={!canUpdateFiles}
            onClick={() => setShowDeleteConfirm(true)}
            tooltip={{
              content: {
                side: 'top',
                text: !canUpdateFiles
                  ? 'You need additional permissions to delete files'
                  : undefined,
              },
            }}
          >
            Delete permanently
          </ButtonTooltip>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div
        key={parentObject.id}
        className="absolute inset-y-0 right-0 z-10 flex flex-col border-l border-overlay bg-surface-100 shadow-lg"
        style={{ width }}
      >
        <div className="flex items-center gap-x-2 border-b border-overlay px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground" title={parentObject.name}>
              Archived file
            </p>
          </div>
          <Button
            variant="text"
            className="h-7 w-7 p-0"
            onClick={handleClose}
            aria-label="Close preview"
          >
            <X size={14} />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {topSlot}

          <div className="space-y-3 px-4 pt-3">
            {!previewedVersion && (
              <div className="space-y-2">
                <DeletedFileDetail label="Original location" value={parentObject.originalPath} />
                <DeletedFileDetail
                  label="Archived"
                  value={`${dayjs(parentObject.deletedAt).format('MMM D, YYYY · HH:mm')} · ${parentObject.deletedBy}`}
                />
              </div>
            )}

            <PreviewSection title="Versions" count={mergedVersions.length} defaultOpen>
              <ol className="flex flex-col gap-y-0.5">
                {mergedVersions.map((version) => (
                  <ArchivedVersionListRow
                    key={version.versionId}
                    version={version}
                    isSelected={previewedVersion?.versionId === version.versionId}
                    canUpdateFiles={canUpdateFiles}
                    isRestoring={isRestoring}
                    isDeleting={isDeletingAnyVersion}
                    onSelect={() => handleSelectVersion(version)}
                    onRestore={() => handleRestore(version)}
                    onDelete={() => setVersionToDelete(version)}
                  />
                ))}
              </ol>
            </PreviewSection>
          </div>
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
        onConfirm={handleDeleteGroup}
      >
        <p className="text-sm text-foreground-light">
          {parentObject.name} and its {mergedVersions.length} version
          {mergedVersions.length === 1 ? '' : 's'} will be permanently deleted and can no longer be
          restored. This action cannot be undone.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        variant="destructive"
        visible={versionToDelete !== undefined}
        title="Permanently delete version"
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isDeletingAnyVersion}
        onCancel={() => setVersionToDelete(undefined)}
        onConfirm={handleDeleteVersion}
      >
        <p className="text-sm text-foreground-light">
          {versionToDelete?.wasCurrentAtArchive ? (
            <>
              The version of {parentObject.name} that was current when it was archived will be
              permanently deleted
              {(parentObject.noncurrentVersions?.length ?? 0) > 0
                ? ' — its next most recent version becomes the one shown here'
                : ', leaving nothing left to restore'}
              . This action cannot be undone.
            </>
          ) : (
            <>
              Version{' '}
              <span className="font-mono text-foreground">
                {versionToDelete?.versionId.slice(0, 8)}
              </span>{' '}
              of {parentObject.name} will be permanently deleted. This action cannot be undone.
            </>
          )}
        </p>
      </ConfirmationModal>
    </>
  )
}

// ── Version restore widget ──────────────────────────────────────────────

interface ArchivedVersionRestoreWidgetProps {
  version: ArchivedVersionRow
  isRestoring: boolean
  onRestore: () => void
  onDismiss: () => void
}

/**
 * Replaces the top preview slot the moment a noncurrent version is selected
 * — mirrors the live file preview panel's compare-and-restore widget, minus
 * the comparison itself: there's no "current" to show side by side with,
 * since the whole file is archived. Restoring un-archives it and promotes
 * this version to current.
 */
const ArchivedVersionRestoreWidget = ({
  version,
  isRestoring,
  onRestore,
  onDismiss,
}: ArchivedVersionRestoreWidgetProps) => {
  const label = version.versionId.slice(0, 8)

  return (
    <div className="space-y-3 border-b border-overlay bg-brand-200/30 p-3">
      <div className="flex items-center gap-x-1.5">
        <RotateCcw size={13} className="shrink-0 text-brand" />
        <p className="truncate text-sm font-medium text-foreground">Restore version {label}?</p>
        <button
          type="button"
          className="ml-auto shrink-0 text-foreground-lighter transition-colors hover:text-foreground"
          onClick={onDismiss}
          aria-label="Cancel"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex items-center gap-x-2">
        <VersionThumbnail isCurrent={false} size={20} />
        <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground-light">
          {dayjs(version.createdAt).format('MMM D, YYYY · HH:mm')} · {formatBytes(version.size)}
        </p>
      </div>

      <Button
        variant="primary"
        className="w-full"
        icon={<RotateCcw size={14} />}
        loading={isRestoring}
        onClick={onRestore}
      >
        Restore as current version
      </Button>

      <p className="text-xs leading-relaxed text-foreground-lighter">
        The file un-archives and this becomes its current version — every other retained version
        stays in its history.
      </p>
    </div>
  )
}

// ── Version row ────────────────────────────────────────────────────────

interface ArchivedVersionListRowProps {
  version: ArchivedVersionRow
  isSelected: boolean
  canUpdateFiles: boolean
  isRestoring: boolean
  isDeleting: boolean
  onSelect: () => void
  onRestore: () => void
  onDelete: () => void
}

const ArchivedVersionListRow = ({
  version,
  isSelected,
  canUpdateFiles,
  isRestoring,
  isDeleting,
  onSelect,
  onRestore,
  onDelete,
}: ArchivedVersionListRowProps) => (
  <li
    role="button"
    tabIndex={0}
    className={cn(
      'group -mx-2 flex items-center gap-x-2.5 rounded-md border border-transparent px-2 py-1.5 cursor-pointer',
      isSelected ? 'bg-brand-200 border-brand-500' : 'hover:bg-surface-200'
    )}
    onClick={onSelect}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onSelect()
    }}
  >
    <VersionThumbnail isCurrent={false} />

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm text-foreground group-hover:underline">
        {dayjs(version.createdAt).format('MMM D, HH:mm')}
      </p>
      <p className="truncate font-mono text-xs text-foreground-lighter">
        {formatBytes(version.size)}
      </p>
    </div>

    <span className="shrink-0 font-mono text-xs text-foreground-lighter">
      {version.versionId.slice(0, 8)}
    </span>

    <ArchivedVersionActionsMenu
      version={version}
      canUpdateFiles={canUpdateFiles}
      isRestoring={isRestoring}
      isDeleting={isDeleting}
      onRestore={onRestore}
      onDelete={onDelete}
    />
  </li>
)

// ── Per-version actions dropdown ────────────────────────────────────────

interface ArchivedVersionActionsMenuProps {
  version: ArchivedVersionRow
  canUpdateFiles: boolean
  isRestoring: boolean
  isDeleting: boolean
  onRestore: () => void
  onDelete: () => void
}

const ArchivedVersionActionsMenu = ({
  version,
  canUpdateFiles,
  isRestoring,
  isDeleting,
  onRestore,
  onDelete,
}: ArchivedVersionActionsMenuProps) => {
  const label = version.versionId.slice(0, 8)
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="text"
            size="tiny"
            className="px-1.5"
            icon={<MoreVertical size={14} />}
            aria-label={`Actions for version ${label}`}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="gap-x-2"
            disabled={!canUpdateFiles || isRestoring}
            onClick={onRestore}
          >
            <RotateCcw size={14} />
            Restore as current
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            disabled={!canUpdateFiles || isDeleting}
            className="gap-x-2 text-destructive focus:text-destructive"
          >
            <Trash2 size={14} />
            Delete permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────

const DeletedFileDetail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="mb-1 text-xs text-foreground-lighter">{label}</label>
    <p className="text-sm text-foreground-light break-all">{value}</p>
  </div>
)
