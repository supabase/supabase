import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useArchivedFilesContext } from './ArchivedFilesContext'
import { ArchivedVersionRestoreWidget } from './ArchivedVersionRestoreWidget'
import { ArchivedVersionRow as ArchivedVersionListRow } from './ArchivedVersionRow'
import { getMergedArchivedVersions, type ArchivedVersionRow } from './archivedVersions.utils'
import { PreviewSection } from './PreviewSection'
import { shortVersion } from './VersionHistory'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useArchivedObjectPurgeMutation } from '@/data/storage/versioning/archived-object-purge-mutation'
import { useArchivedObjectRestoreMutation } from '@/data/storage/versioning/archived-object-restore-mutation'
import { useArchivedObjectVersionDeleteMutation } from '@/data/storage/versioning/archived-object-version-delete-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const PANEL_WIDTH = 450

const ArchivedFileDetail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="mb-1 text-xs text-foreground-lighter">{label}</label>
    <p className="break-all text-sm text-foreground-light">{value}</p>
  </div>
)

/** Replaces `PreviewPane` while an archived row is selected. */
export const ArchivedFilePreviewPane = () => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const {
    selectedArchivedObject: object,
    selectedArchivedVersion: previewedVersion,
    setSelectedArchivedVersion,
    clearArchivedSelection,
  } = useArchivedFilesContext()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const [isPurgeConfirmVisible, setIsPurgeConfirmVisible] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<ArchivedVersionRow>()

  // Restoring any row un-archives the whole file; only the toast differs.
  const { mutate: restoreObject, isPending: isRestoring } = useArchivedObjectRestoreMutation()

  const { mutate: purgeObject, isPending: isPurging } = useArchivedObjectPurgeMutation({
    onSuccess: () => {
      toast.success('File permanently deleted')
      setIsPurgeConfirmVisible(false)
      clearArchivedSelection()
    },
  })

  const { mutate: deleteVersion, isPending: isDeletingVersion } =
    useArchivedObjectVersionDeleteMutation({
      onSuccess: () => {
        toast.success('Version permanently deleted')
        setVersionToDelete(undefined)
      },
    })

  if (object === undefined) return null

  const mergedVersions = getMergedArchivedVersions(object)
  const hasOlderVersions = object.noncurrentVersions.length > 0

  const handleRestore = (version?: ArchivedVersionRow) => {
    if (!projectRef || !selectedBucket?.id) return
    restoreObject(
      { projectRef, bucketId: selectedBucket.id, archivedObjectId: object.id },
      {
        onSuccess: () => {
          toast.success(
            version && !version.wasCurrentAtArchive
              ? `File restored — version ${shortVersion(version.versionId)} is now current`
              : 'File restored'
          )
          clearArchivedSelection()
        },
      }
    )
  }

  const handleDeleteVersion = () => {
    if (!projectRef || !selectedBucket?.id || versionToDelete === undefined) return
    deleteVersion({
      projectRef,
      bucketId: selectedBucket.id,
      archivedObjectId: object.id,
      versionId: versionToDelete.versionId,
      wasCurrentAtArchive: versionToDelete.wasCurrentAtArchive,
    })
  }

  // A plain restore already produces the version that was current at archive time.
  const handleSelectVersion = (version: ArchivedVersionRow) =>
    setSelectedArchivedVersion(version.wasCurrentAtArchive ? undefined : version)

  const getVersionDeleteCopy = () => {
    if (versionToDelete === undefined) return null
    if (!versionToDelete.wasCurrentAtArchive) {
      return (
        <>
          Version{' '}
          <span className="font-mono text-foreground">
            {shortVersion(versionToDelete.versionId)}
          </span>{' '}
          of {object.path} will be deleted permanently. This cannot be undone.
        </>
      )
    }
    return (
      <>
        The version of {object.path} that was current when it was archived will be deleted
        permanently
        {hasOlderVersions
          ? ' — its next most recent version becomes the one shown here'
          : ', leaving nothing left to restore'}
        . This cannot be undone.
      </>
    )
  }

  return (
    <>
      <div
        key={object.id}
        className="flex h-full flex-col border-l border-overlay bg-surface-100"
        style={{ width: PANEL_WIDTH }}
      >
        <div className="flex items-center gap-x-2 border-b border-overlay px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            Archived file
          </p>
          <Button
            variant="text"
            className="h-7 w-7 shrink-0 p-0"
            onClick={clearArchivedSelection}
            aria-label="Close preview"
          >
            <X size={14} />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {previewedVersion !== undefined ? (
            <ArchivedVersionRestoreWidget
              version={previewedVersion}
              isRestoring={isRestoring}
              onRestore={() => handleRestore(previewedVersion)}
              onDismiss={() => setSelectedArchivedVersion(undefined)}
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
                <p className="truncate text-sm font-medium text-foreground" title={object.path}>
                  {object.path}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 truncate text-xs text-foreground-light">
                  {formatBytes(object.currentVersion.size)}
                  <Badge variant="warning" className="-my-1">
                    Archived
                  </Badge>
                </p>

                <div className="mt-3 flex shrink-0 items-center gap-x-1">
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
                        text: canUpdateFiles
                          ? undefined
                          : 'You need additional permissions to restore files',
                      },
                    }}
                  >
                    Restore file
                  </ButtonTooltip>
                  <ButtonTooltip
                    variant="outline"
                    size="tiny"
                    icon={<Trash2 size={14} />}
                    disabled={!canUpdateFiles}
                    onClick={() => setIsPurgeConfirmVisible(true)}
                    tooltip={{
                      content: {
                        side: 'top',
                        text: canUpdateFiles
                          ? undefined
                          : 'You need additional permissions to delete files',
                      },
                    }}
                  >
                    Delete permanently
                  </ButtonTooltip>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 px-4 pt-3">
            {previewedVersion === undefined && (
              <div className="space-y-2">
                <ArchivedFileDetail label="Original location" value={object.path} />
                <ArchivedFileDetail
                  label="Archived"
                  value={dayjs(object.archivedAt).format('MMM D, YYYY · HH:mm')}
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
                    isDeleting={isDeletingVersion}
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
        visible={isPurgeConfirmVisible}
        title={<span className="wrap-break-word">Permanently delete {object.path}?</span>}
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isPurging}
        onCancel={() => setIsPurgeConfirmVisible(false)}
        onConfirm={() => {
          if (!projectRef || !selectedBucket?.id) return
          purgeObject({ projectRef, bucketId: selectedBucket.id, archivedObjectId: object.id })
        }}
        alert={{
          base: { variant: 'destructive' },
          title: 'This cannot be undone',
          description: `Deletes the file and all ${mergedVersions.length} retained version${
            mergedVersions.length === 1 ? '' : 's'
          }. None of them can be restored afterwards.`,
        }}
      />

      <ConfirmationModal
        variant="destructive"
        visible={versionToDelete !== undefined}
        title="Permanently delete this version?"
        confirmLabel="Delete version"
        confirmLabelLoading="Deleting..."
        loading={isDeletingVersion}
        onCancel={() => setVersionToDelete(undefined)}
        onConfirm={handleDeleteVersion}
      >
        <p className="text-sm text-foreground-light">{getVersionDeleteCopy()}</p>
      </ConfirmationModal>
    </>
  )
}
