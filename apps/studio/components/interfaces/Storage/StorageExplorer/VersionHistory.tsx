import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { MoreVerticalIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { BroomSparklesIcon } from '../BroomSparklesIcon'
import type { BucketVersioningState, ExpirationMode } from '../StorageVersioning.constants'
import { computeVersionFate, type VersionFate } from './VersionHistory.utils'
import { VersionHistoryPolicyRow } from './VersionHistoryPolicyRow'
import { VersionThumbnail } from './VersionThumbnail'
import { AlertError } from '@/components/ui/AlertError'
import { useObjectVersionDeleteMutation } from '@/data/storage/versioning/object-version-delete-mutation'
import { useObjectVersionRestoreMutation } from '@/data/storage/versioning/object-version-restore-mutation'
import {
  objectVersionsQueryOptions,
  type LifecyclePolicy,
  type ObjectVersion,
} from '@/data/storage/versioning/object-versions-query'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

/** Version IDs are long opaque strings; show enough to tell two rows apart. */
export const shortVersion = (versionId: string) => `${versionId.slice(0, 6)}…${versionId.slice(-2)}`

const VersionRowBadge = ({
  isCurrent,
  isComparing,
  fate,
}: {
  isCurrent: boolean
  isComparing: boolean
  fate?: VersionFate
}) => {
  if (isCurrent) return <Badge variant="success">Current</Badge>
  if (isComparing) return <Badge variant="success">Comparing</Badge>
  if (!fate || fate.type === 'retained') return null

  let label: string
  switch (fate.type) {
    case 'expires-in':
      label = `${fate.days}d`
      break
    case 'expires-on-next-upload':
      label = `${fate.daysRemaining}d`
      break
    case 'cap-expiry-pending':
      label = `${fate.daysRemaining}d`
      break
    case 'expiry-due':
      label = 'Queued'
      break
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          'shrink-0 text-xs text-foreground-lighter',
          fate.type === 'expires-on-next-upload' && 'text-warning-600',
          fate.type === 'cap-expiry-pending' && 'text-warning-600',
          fate.type === 'expiry-due' && 'text-destructive'
        )}
      >
        <span className="flex items-center gap-1">
          <BroomSparklesIcon size={13} />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        {versionFateDescription(fate)}
        {fate.type === 'expiry-due' &&
          'It matches the lifecycle policy and can take up to 24 hours to delete.'}
      </TooltipContent>
    </Tooltip>
  )
}

const versionFateDescription = (fate: VersionFate) => {
  switch (fate.type) {
    case 'retained':
      return 'Not currently scheduled to expire'
    case 'expires-in':
      return `Expires in ${fate.days} ${fate.days === 1 ? 'day' : 'days'}.`
    case 'expires-on-next-upload':
      return `Expires on next upload or in ${fate.daysRemaining} ${fate.daysRemaining === 1 ? 'day' : 'days'}.`
    case 'cap-expiry-pending':
      return `This version is beyond the limit of ${fate.cap} kept ${fate.cap === 1 ? 'version' : 'versions'} and becomes eligible to expire in ${fate.daysRemaining} ${fate.daysRemaining === 1 ? 'day' : 'days'}.`
    case 'expiry-due':
      return 'Queued to expire.'
  }
}

const VersionDetailsRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start justify-between gap-x-4 text-xs">
    <span className="shrink-0 text-foreground-lighter">{label}</span>
    <span className="min-w-0 break-all text-right text-foreground font-mono tracking-tight">
      {children}
    </span>
  </div>
)

const VersionDetails = ({ version, fate }: { version: ObjectVersion; fate?: VersionFate }) => (
  <>
    <div className="space-y-1 px-2 py-1.5">
      <VersionDetailsRow label="Version ID">{version.versionId}</VersionDetailsRow>
      <VersionDetailsRow label="Created at">
        {dayjs(version.createdAt).format('MMM D, YYYY · HH:mm')}
      </VersionDetailsRow>
      {version.archivedAt && (
        <VersionDetailsRow label="Archived at">
          {dayjs(version.archivedAt).format('MMM D, YYYY · HH:mm')}
        </VersionDetailsRow>
      )}
      {fate && (
        <VersionDetailsRow label="Lifecycle">{versionFateDescription(fate)}</VersionDetailsRow>
      )}
    </div>
    <DropdownMenuSeparator />
  </>
)

interface VersionActionsMenuProps {
  version: ObjectVersion
  fate?: VersionFate
  isRestoring: boolean
  onRestore: () => void
  onDelete: () => void
}

const VersionActionsMenu = ({
  version,
  fate,
  isRestoring,
  onRestore,
  onDelete,
}: VersionActionsMenuProps) => {
  const label = shortVersion(version.versionId)
  const isDeleteMarker = version.action === 'delete marker'

  if (version.isCurrent) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="text"
          size="tiny"
          className="px-1.5"
          icon={<MoreVerticalIcon size={14} />}
          aria-label={isDeleteMarker ? 'Actions for delete marker' : `Actions for version ${label}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <VersionDetails version={version} fate={fate} />
        {/* A marker holds no content, so there is nothing to restore to. */}
        {!isDeleteMarker && (
          <>
            <DropdownMenuItem className="gap-x-2" disabled={isRestoring} onClick={onRestore}>
              <RotateCcwIcon size={14} />
              Restore as current
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-x-2 text-destructive focus:text-destructive"
        >
          <Trash2Icon size={14} />
          {isDeleteMarker ? (
            <span>Delete marker permanently</span>
          ) : (
            <span>Delete permanently</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface VersionHistoryProps {
  projectRef?: string
  bucketId?: string
  objectName: string
  path: string
  versioningState: BucketVersioningState
  willRetainVersionOnWrite: boolean
  lifecyclePolicy: LifecyclePolicy
  expirationMode: ExpirationMode
  mimeType?: string
  previewedVersionId?: string
  onPreview?: (version: ObjectVersion) => void
  clearPreview: () => void
  onEditBucket: () => void
}

export const VersionHistory = ({
  projectRef,
  bucketId,
  objectName,
  path,
  versioningState,
  willRetainVersionOnWrite,
  lifecyclePolicy,
  expirationMode,
  mimeType,
  previewedVersionId,
  onPreview,
  clearPreview,
  onEditBucket,
}: VersionHistoryProps) => {
  const {
    data: versions,
    isPending,
    isError,
    error,
    isSuccess,
  } = useQuery(objectVersionsQueryOptions({ projectRef, bucketId, path, lifecyclePolicy }))

  const { refetchAllOpenedFolders } = useStorageExplorerStateSnapshot()

  const [versionToDelete, setVersionToDelete] = useState<ObjectVersion>()

  const { mutate: restoreVersion, isPending: isRestoring } = useObjectVersionRestoreMutation({
    onSuccess: async () => {
      toast.success('Version restored as the current version')
      // The restored version is the current one now, so the widget would be offering
      // to restore the file to what it already is.
      clearPreview()
      // The object's size, type and modified date all change with it, and the row
      // showing them is the explorer's own state.
      await refetchAllOpenedFolders()
    },
  })

  const { mutate: deleteVersion, isPending: isDeleting } = useObjectVersionDeleteMutation({
    onSuccess: () => {
      toast.success('Version permanently deleted')
      // Nothing left to compare against if the widget was showing this one.
      if (previewedVersionId === versionToDelete?.versionId) clearPreview()
      setVersionToDelete(undefined)
    },
  })

  const { expiryDays, maxVersions: cap } = lifecyclePolicy
  const hasPolicy = (cap !== null && cap > 0) || (expiryDays !== null && expiryDays > 0)

  // Versions are ordered by archivedAt descending (current first), so the oldest
  // noncurrent version sits at `chronoIndex` 0.
  const fateByVersionId = useMemo(() => {
    const noncurrentVersions = (versions ?? []).filter((version) => !version.isCurrent)
    const noncurrentCount = noncurrentVersions.length

    return noncurrentVersions.reduce((fates, version, index) => {
      if (version.archivedAt) {
        fates.set(
          version.versionId,
          computeVersionFate({
            daysOld: dayjs().diff(dayjs(version.archivedAt), 'day'),
            chronoIndex: noncurrentCount - 1 - index,
            noncurrentCount,
            expiryDays,
            cap,
            mode: expirationMode,
            willRetainVersionOnWrite,
          })
        )
      }
      return fates
    }, new Map<string, VersionFate>())
  }, [versions, expiryDays, cap, expirationMode, willRetainVersionOnWrite])

  const handleRestore = (version: ObjectVersion) => {
    if (!projectRef || !bucketId) return
    restoreVersion({ projectRef, bucketId, path, versionId: version.versionId })
  }

  if (isPending) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve versions" />

  return (
    <div className="space-y-4">
      {hasPolicy && (
        <VersionHistoryPolicyRow
          cap={cap}
          expiryDays={expiryDays}
          mode={expirationMode}
          onEditBucket={onEditBucket}
        />
      )}

      {versioningState === 'suspended' && willRetainVersionOnWrite && (
        <Admonition
          type="default"
          title="Versioning is suspended on this bucket"
          description="Replacing this file retains the current version one last time. Anything uploaded after that overwrites it in place."
        />
      )}

      {versioningState === 'suspended' && !willRetainVersionOnWrite && (
        <Admonition
          type="default"
          title="Versioning is suspended on this bucket"
          description="Replacing this file overwrites it in place. The versions below stay retained until you delete them or a lifecycle policy expires them."
        />
      )}

      {isSuccess && versions.length === 0 && (
        <p className="text-sm text-foreground-light">
          No previous versions yet. Overwriting this file will retain a recoverable copy here.
        </p>
      )}

      {isSuccess && versions.length > 0 && (
        <ol className="flex flex-col gap-y-0.5">
          {versions.map((version) => {
            const isComparing = previewedVersionId === version.versionId
            const isDeleteMarker = version.action === 'delete marker'

            const rowContent = (
              <>
                <VersionThumbnail
                  // Falls back to the file's own type only for the version that is it.
                  mimeType={version.mimeType ?? (version.isCurrent ? mimeType : undefined)}
                  isCurrent={version.isCurrent}
                  isDeleteMarker={isDeleteMarker}
                  path={path}
                  versionId={version.versionId}
                  byteSize={version.size}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-sm text-foreground',
                      !isDeleteMarker && onPreview && 'group-hover:underline'
                    )}
                  >
                    {shortVersion(version.versionId)}
                  </span>
                  <span className="block truncate font-mono text-xs text-foreground-lighter">
                    {isDeleteMarker ? 'Delete marker' : formatBytes(version.size)}
                  </span>
                </span>
              </>
            )

            return (
              <li
                key={version.versionId}
                className={cn(
                  'group -mx-2 flex items-center gap-x-2.5 rounded-md border border-transparent px-2 py-1.5',
                  isComparing && 'border-brand-500 bg-brand-200',
                  !isComparing && isDeleteMarker && 'opacity-70',
                  !isComparing && !isDeleteMarker && 'hover:bg-surface-200'
                )}
              >
                {/* A marker has no content to preview */}
                {isDeleteMarker ? (
                  <span className="flex min-w-0 flex-1 items-center gap-x-2.5">{rowContent}</span>
                ) : (
                  <button
                    type="button"
                    tabIndex={0}
                    className="flex min-w-0 flex-1 items-center gap-x-2.5 text-left"
                    onClick={() => (version.isCurrent ? clearPreview() : onPreview?.(version))}
                  >
                    {rowContent}
                  </button>
                )}

                <VersionRowBadge
                  isCurrent={version.isCurrent}
                  isComparing={isComparing}
                  fate={fateByVersionId.get(version.versionId)}
                />

                <VersionActionsMenu
                  version={version}
                  fate={fateByVersionId.get(version.versionId)}
                  isRestoring={isRestoring}
                  onRestore={() => handleRestore(version)}
                  onDelete={() => setVersionToDelete(version)}
                />
              </li>
            )
          })}
        </ol>
      )}

      <ConfirmationModal
        variant="destructive"
        visible={versionToDelete !== undefined}
        title={
          versionToDelete?.action === 'delete marker'
            ? 'Permanently delete this delete marker?'
            : 'Permanently delete this version?'
        }
        confirmLabel={
          versionToDelete?.action === 'delete marker' ? 'Delete marker' : 'Delete version'
        }
        confirmLabelLoading="Deleting..."
        loading={isDeleting}
        onCancel={() => setVersionToDelete(undefined)}
        onConfirm={() => {
          if (!projectRef || !bucketId || !versionToDelete) return
          deleteVersion({
            projectRef,
            bucketId,
            path,
            versionId: versionToDelete.versionId,
          })
        }}
      >
        {versionToDelete?.action === 'delete marker' ? (
          <p className="text-sm text-foreground-light">
            The delete marker in {objectName}&apos;s history will be removed permanently. Other
            versions of this file are not affected. This cannot be undone.
          </p>
        ) : (
          <p className="text-sm text-foreground-light">
            Version{' '}
            <span className="font-mono text-foreground">
              {versionToDelete ? shortVersion(versionToDelete.versionId) : ''}
            </span>{' '}
            of {objectName} will be deleted permanently. The current version is not affected. This
            cannot be undone.
          </p>
        )}
      </ConfirmationModal>
    </div>
  )
}
