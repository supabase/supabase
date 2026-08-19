import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { MoreVertical, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { Admonition } from 'ui-patterns/Admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

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

/** Version IDs are long opaque strings; show enough to tell two rows apart. */
export const shortVersion = (versionId: string) => `${versionId.slice(0, 6)}…${versionId.slice(-2)}`

const VersionFateLabel = ({ fate }: { fate: VersionFate }) => {
  switch (fate.type) {
    case 'retained':
      return null
    case 'expires-in':
      return (
        <span className="shrink-0 text-xs text-foreground-lighter">
          Expires in <span className="text-foreground-light">{fate.days}d</span>
        </span>
      )
    case 'expires-on-next-upload':
      return (
        <div className="flex flex-col items-end">
          <span className="shrink-0 text-xs text-warning-600">Expires on next upload</span>
          <span className="shrink-0 text-xs text-warning-600">or in {fate.daysRemaining}d</span>
        </div>
      )
    case 'expiring-now':
      return <span className="shrink-0 text-xs text-destructive">Expiring now</span>
  }
}

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
  if (fate) return <VersionFateLabel fate={fate} />
  return null
}

interface VersionActionsMenuProps {
  version: ObjectVersion
  isRestoring: boolean
  onRestore: () => void
  onDelete: () => void
}

const VersionActionsMenu = ({
  version,
  isRestoring,
  onRestore,
  onDelete,
}: VersionActionsMenuProps) => {
  const label = shortVersion(version.versionId)
  const isDeleteMarker = version.action === 'delete marker'

  // Restoring and deleting only make sense for the versions behind the current one.
  if (version.isCurrent) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="text"
          size="tiny"
          className="px-1.5"
          icon={<MoreVertical size={14} />}
          aria-label={isDeleteMarker ? 'Actions for delete marker' : `Actions for version ${label}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* A marker holds no content, so there is nothing to restore to. */}
        {!isDeleteMarker && (
          <>
            <DropdownMenuItem className="gap-x-2" disabled={isRestoring} onClick={onRestore}>
              <RotateCcw size={14} />
              Restore as current
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-x-2 text-destructive focus:text-destructive"
        >
          <Trash2 size={14} />
          {isDeleteMarker ? 'Delete marker permanently' : 'Delete permanently'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface VersionHistoryProps {
  projectRef?: string
  bucketId?: string
  objectName: string
  versioningState: BucketVersioningState
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
  versioningState,
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
  } = useQuery(objectVersionsQueryOptions({ projectRef, bucketId, objectName, lifecyclePolicy }))

  const [versionToDelete, setVersionToDelete] = useState<ObjectVersion>()

  const { mutate: restoreVersion, isPending: isRestoring } = useObjectVersionRestoreMutation({
    onSuccess: () => toast.success('Version restored as the current version'),
  })

  const { mutate: deleteVersion, isPending: isDeleting } = useObjectVersionDeleteMutation({
    onSuccess: () => {
      toast.success('Version permanently deleted')
      setVersionToDelete(undefined)
    },
  })

  const { expiryDays, maxVersions: cap } = lifecyclePolicy
  const hasPolicy = (cap !== null && cap > 0) || (expiryDays !== null && expiryDays > 0)

  // `versions` arrives newest-first, so the oldest sits at `chronoIndex` 0.
  const fateByVersionId = useMemo(() => {
    const noncurrentVersions = (versions ?? []).filter((version) => !version.isCurrent)
    const noncurrentCount = noncurrentVersions.length

    return new Map(
      noncurrentVersions.map((version, index) => [
        version.versionId,
        computeVersionFate({
          daysOld: dayjs().diff(dayjs(version.createdAt), 'day'),
          chronoIndex: noncurrentCount - 1 - index,
          noncurrentCount,
          expiryDays,
          cap,
          mode: expirationMode,
        }),
      ])
    )
  }, [versions, expiryDays, cap, expirationMode])

  const handleRestore = (version: ObjectVersion) => {
    if (!projectRef || !bucketId) return
    restoreVersion({ projectRef, bucketId, objectName, versionId: version.versionId })
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

      {versioningState === 'suspended' && (
        <Admonition
          type="default"
          title="Versioning is suspended on this bucket"
          description="New noncurrent versions are no longer created. Everything already retained here stays as it is until you delete it or a lifecycle policy expires it."
        />
      )}

      {isSuccess && versions.length === 0 && (
        <p className="text-sm text-foreground-light">
          No previous versions yet. Overwriting this file will keep a recoverable copy here.
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
                  mimeType={mimeType}
                  isCurrent={version.isCurrent}
                  isDeleteMarker={isDeleteMarker}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-sm text-foreground',
                      !isDeleteMarker && onPreview && 'group-hover:underline'
                    )}
                  >
                    {dayjs(version.createdAt).format('MMM D, HH:mm')}
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
            objectName,
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
