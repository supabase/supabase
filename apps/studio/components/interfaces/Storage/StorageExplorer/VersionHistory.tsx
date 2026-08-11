import dayjs from 'dayjs'
import { Copy, Download, MoreVertical, RotateCcw, Trash2 } from 'lucide-react'
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
import { Admonition } from 'ui-patterns/Admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import {
  useObjectVersionDeleteMutation,
  useObjectVersionRestoreMutation,
  useObjectVersionsQuery,
} from '@/data/storage/protection/object-versions-query'
import { type ObjectVersion } from '@/data/storage/protection/protection-mocks'
import { formatBytes } from '@/lib/helpers'

import { BroomSparklesIcon } from '../BroomSparklesIcon'
import { getMockBucketProtection, type ExpirationMode } from '../StorageProtection.constants'

interface VersionHistoryProps {
  projectRef?: string
  bucketId?: string
  objectName: string
  previewedVersionId?: string
  onPreview?: (version: ObjectVersion) => void
}

const shortVersion = (versionId: string) => `${versionId.slice(0, 6)}…${versionId.slice(-2)}`

export const VersionHistory = ({
  projectRef,
  bucketId,
  objectName,
  previewedVersionId,
  onPreview,
}: VersionHistoryProps) => {
  const {
    data: versions,
    isPending,
    isError,
    error,
    isSuccess,
  } = useObjectVersionsQuery({ projectRef, bucketId, objectName })

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

  const handleRestore = (version: ObjectVersion) => {
    if (!projectRef || !bucketId) return
    restoreVersion({ projectRef, bucketId, objectName, versionId: version.versionId })
  }

  if (isPending) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve versions" />

  const noncurrentCount = versions.filter((v) => !v.isCurrent).length

  const bucketProtection = getMockBucketProtection(bucketId)
  const cap = bucketProtection.maxNoncurrentVersions
  const expiryDays = bucketProtection.versionExpiryDays
  const mode = bucketProtection.expirationMode
  const hasCap = cap !== null && cap > 0
  const hasExpiryDays = expiryDays !== null && expiryDays > 0
  const hasPolicy = hasCap || hasExpiryDays

  const usageRatio = hasCap ? noncurrentCount / cap : 0
  const isNearingCap = hasCap && usageRatio >= 0.8
  const isAtCap = hasCap && noncurrentCount >= cap

  // Pre-compute each noncurrent version's chronological position (1-based,
  // oldest = 1) and whether it would be evicted by the cap rule (the oldest
  // `count - cap` versions when count exceeds cap). Numbering runs oldest→
  // newest so reading the list top-to-bottom matches the numbering intuition:
  // the bottom row (oldest, closest to eviction) is #1 and each row above it
  // increments toward the newest noncurrent.
  const noncurrentVersions = versions.filter((v) => !v.isCurrent)
  const versionMeta = new Map<string, { position: number; capExceeded: boolean }>()
  noncurrentVersions.forEach((v, i) => {
    // `versions` arrives newest-first, so oldest sits at index count - 1.
    const chronoIndex = noncurrentCount - 1 - i
    versionMeta.set(v.versionId, {
      position: chronoIndex + 1,
      capExceeded: hasCap && chronoIndex < noncurrentCount - cap,
    })
  })

  return (
    <div className="space-y-4">
      {hasPolicy && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {hasCap && (
            <Badge variant={isAtCap ? 'warning' : 'default'}>
              {noncurrentCount} / {cap} noncurrent
            </Badge>
          )}
          {hasExpiryDays && <Badge variant="default">{expiryDays}d retention</Badge>}
          {hasCap && hasExpiryDays && (
            <span className="text-xs text-foreground-lighter">
              {mode === 'and' ? 'both conditions required' : 'either condition expires'}
            </span>
          )}
          {isAtCap && (
            <span className="text-xs text-warning-600">
              The next overwrite will auto-expire the oldest version.
            </span>
          )}
          {!isAtCap && isNearingCap && (
            <span className="text-xs text-foreground-lighter">
              Nearing cap. Older versions auto-expire once the limit is reached.
            </span>
          )}
        </div>
      )}

      {bucketProtection.versioning === 'suspended' && (
        <Admonition
          type="default"
          title="Versioning is suspended for this bucket"
          description="No new noncurrent versions will be created until you re-enable it. Everything already retained here stays exactly as it is until you delete it or a lifecycle policy expires it."
        />
      )}

      {isSuccess && (
        <ol className="flex flex-col">
          {versions.map((version) => {
            const isSelected = previewedVersionId === version.versionId
            return (
              <li key={version.versionId} className="group flex gap-x-3">
                <div className="flex flex-col items-center pt-1.5">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      version.isCurrent || isSelected ? 'bg-brand' : 'bg-foreground-muted'
                    )}
                  />
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className="-mx-2 flex-1 cursor-pointer px-2 pb-4"
                  onClick={() => onPreview?.(version)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onPreview?.(version)
                  }}
                >
                  <div className="flex items-center justify-between gap-x-2">
                    <div className="flex items-center gap-x-2">
                      <span
                        className={cn(
                          'text-sm',
                          isSelected ? 'text-brand' : 'text-foreground',
                          onPreview && 'group-hover:underline'
                        )}
                      >
                        {dayjs(version.createdAt).format('MMM D, HH:mm')}
                      </span>
                      {version.isCurrent && <Badge variant="success">Current</Badge>}
                    </div>

                    <VersionActionsMenu
                      version={version}
                      isRestoring={isRestoring}
                      onRestore={() => handleRestore(version)}
                      onDelete={() => setVersionToDelete(version)}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-foreground-lighter">
                    {formatBytes(version.size)}
                  </p>
                  {!version.isCurrent &&
                    hasPolicy &&
                    (() => {
                      const meta = versionMeta.get(version.versionId)
                      if (!meta) return null
                      return (
                        <VersionExpiryIndicator
                          version={version}
                          position={meta.position}
                          capExceeded={meta.capExceeded}
                          expiryDays={expiryDays}
                          cap={cap}
                          mode={mode}
                        />
                      )
                    })()}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <ConfirmationModal
        variant="destructive"
        visible={versionToDelete !== undefined}
        title="Permanently delete version"
        confirmLabel="Delete permanently"
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
        <p className="text-sm text-foreground-light">
          Version{' '}
          <span className="font-mono text-foreground">
            {versionToDelete ? shortVersion(versionToDelete.versionId) : ''}
          </span>{' '}
          of {objectName} will be permanently deleted. The current version is not affected. This
          action cannot be undone.
        </p>
      </ConfirmationModal>
    </div>
  )
}

// ── Per-version actions dropdown ────────────────────────────────────────

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
          <DropdownMenuItem onClick={() => toast.success(`Downloading ${label}`)}>
            <Download size={14} />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.success(`Copied URL for ${label}`)}>
            <Copy size={14} />
            Get URL
          </DropdownMenuItem>
          {!version.isCurrent && (
            <>
              <DropdownMenuItem disabled={isRestoring} onClick={onRestore}>
                <RotateCcw size={14} />
                Restore as current
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} />
                Delete permanently
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Per-version expiry indicator ────────────────────────────────────────

interface VersionExpiryIndicatorProps {
  version: ObjectVersion
  /** 1-based chronological position — 1 = oldest noncurrent, N = newest. */
  position: number
  /** True when this version sits in the "would be evicted by cap" tail. */
  capExceeded: boolean
  expiryDays: number | null
  cap: number | null
  mode: ExpirationMode
}

const VersionExpiryIndicator = ({
  version,
  position,
  capExceeded,
  expiryDays,
  cap,
  mode,
}: VersionExpiryIndicatorProps) => {
  const hasDaysRule = expiryDays !== null && expiryDays > 0
  const hasCapRule = cap !== null && cap > 0

  const daysOld = dayjs().diff(dayjs(version.createdAt), 'day')
  const daysRemaining = hasDaysRule ? expiryDays - daysOld : null
  const exceedsDays = hasDaysRule && daysOld >= expiryDays

  // Whether this version would expire under the combined policy
  const wouldExpire =
    hasDaysRule && hasCapRule
      ? mode === 'and'
        ? exceedsDays && capExceeded
        : exceedsDays || capExceeded
      : exceedsDays || capExceeded

  const daysLabel = hasDaysRule
    ? daysRemaining !== null && daysRemaining > 0
      ? `Expires in ${daysRemaining}d`
      : `Past ${expiryDays}d limit`
    : null

  if (daysLabel === null && !hasCapRule) return null

  const isWarning = wouldExpire
  const isSoonToExpire = !wouldExpire && daysRemaining !== null && daysRemaining <= 7
  const emphasize = isWarning || isSoonToExpire

  return (
    <div className="mt-1 flex items-center gap-x-2">
      {daysLabel !== null && (
        <span
          className={cn(
            'inline-flex items-center gap-x-1 text-xs',
            emphasize ? 'text-warning-600' : 'text-foreground-muted'
          )}
        >
          <BroomSparklesIcon size={12} />
          {daysLabel}
        </span>
      )}
      {hasCapRule && (
        <Badge variant={isWarning ? 'warning' : 'default'}>
          {position}/{cap}
        </Badge>
      )}
    </div>
  )
}
