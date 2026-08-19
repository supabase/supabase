import dayjs from 'dayjs'
import {
  Copy,
  Download,
  File,
  Film,
  Image as ImageIcon,
  Info,
  MinusCircle,
  MoreVertical,
  Music,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState, type ReactNode } from 'react'
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { BroomSparklesIcon } from '../BroomSparklesIcon'
import { getMockBucketProtection, type ExpirationMode } from '../StorageProtection.constants'
import { computeVersionFate, type VersionFate } from './VersionHistory.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import {
  useObjectVersionDeleteMutation,
  useObjectVersionRestoreMutation,
  useObjectVersionsQuery,
} from '@/data/storage/protection/object-versions-query'
import { type ObjectVersion } from '@/data/storage/protection/protection-mocks'
import { formatBytes } from '@/lib/helpers'

interface VersionHistoryProps {
  projectRef?: string
  bucketId?: string
  objectName: string
  /** Drives the row thumbnail glyph — falls back to a generic file icon. */
  mimeType?: string
  previewedVersionId?: string
  onPreview?: (version: ObjectVersion) => void
  clearPreview: () => void
}

export const shortVersion = (versionId: string) => `${versionId.slice(0, 6)}…${versionId.slice(-2)}`

export const VersionHistory = ({
  projectRef,
  bucketId,
  objectName,
  mimeType,
  previewedVersionId,
  onPreview,
  clearPreview,
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

  // Pre-compute each noncurrent version's fate (Kept / Expires in Nd /
  // Expires on next upload / Expiring now). `versions` arrives newest-first,
  // so the oldest noncurrent version sits at chronoIndex 0.
  const noncurrentVersions = versions.filter((v) => !v.isCurrent)
  const fateByVersionId = new Map<string, VersionFate>()
  noncurrentVersions.forEach((v, i) => {
    const chronoIndex = noncurrentCount - 1 - i
    fateByVersionId.set(
      v.versionId,
      computeVersionFate({
        daysOld: dayjs().diff(dayjs(v.createdAt), 'day'),
        chronoIndex,
        noncurrentCount,
        expiryDays,
        cap,
        mode,
      })
    )
  })

  return (
    <div className="space-y-4">
      {hasPolicy && <PolicyRow cap={cap} expiryDays={expiryDays} mode={mode} />}

      {bucketProtection.versioning === 'suspended' && (
        <Admonition
          type="default"
          title="Versioning is suspended for this bucket"
          description="No new noncurrent versions will be created until you re-enable it. Everything already retained here stays exactly as it is until you delete it or a lifecycle policy expires it."
        />
      )}

      {isSuccess && (
        <ol className="flex flex-col gap-y-0.5">
          {versions.map((version) => {
            const isSelected = previewedVersionId === version.versionId
            const fate = version.isCurrent ? undefined : fateByVersionId.get(version.versionId)
            const isDeleteMarker = version.action === 'delete marker'
            // Delete markers are empty placeholders — nothing to preview,
            // restore, or download, so the row isn't clickable and only
            // gets a "Permanently delete" action.
            const isRowClickable = !isDeleteMarker

            return (
              <li
                key={version.versionId}
                role={isRowClickable ? 'button' : undefined}
                tabIndex={isRowClickable ? 0 : -1}
                className={cn(
                  'group -mx-2 flex items-center gap-x-2.5 rounded-md px-2 py-1.5 border border-transparent',
                  isRowClickable && 'cursor-pointer',
                  isSelected
                    ? 'bg-brand-200 border-brand-500'
                    : isRowClickable
                      ? 'hover:bg-surface-200'
                      : 'opacity-70'
                )}
                onClick={() => {
                  if (!isRowClickable) return
                  version.isCurrent ? clearPreview() : onPreview?.(version)
                }}
                onKeyDown={(e) => {
                  if (!isRowClickable) return
                  if (e.key === 'Enter' || e.key === ' ')
                    version.isCurrent ? clearPreview : onPreview?.(version)
                }}
              >
                <VersionThumbnail
                  mimeType={mimeType}
                  isCurrent={version.isCurrent}
                  isDeleteMarker={isDeleteMarker}
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm text-foreground',
                      isRowClickable && onPreview && 'group-hover:underline'
                    )}
                  >
                    {dayjs(version.createdAt).format('MMM D, HH:mm')}
                  </p>
                  <p className="truncate font-mono text-xs text-foreground-lighter">
                    {isDeleteMarker ? 'Delete marker' : formatBytes(version.size)}
                  </p>
                </div>

                {version.isCurrent ? (
                  <Badge variant="success">Current</Badge>
                ) : isSelected ? (
                  <Badge variant="success">Comparing</Badge>
                ) : (
                  fate && <VersionFateLabel fate={fate} />
                )}

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
            ? 'Permanently delete marker'
            : 'Permanently delete version'
        }
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
          {versionToDelete?.action === 'delete marker' ? (
            <>
              The delete marker in {objectName}'s history will be permanently removed. Other
              versions of this file are not affected. This action cannot be undone.
            </>
          ) : (
            <>
              Version{' '}
              <span className="font-mono text-foreground">
                {versionToDelete ? shortVersion(versionToDelete.versionId) : ''}
              </span>{' '}
              of {objectName} will be permanently deleted. The current version is not affected.
              This action cannot be undone.
            </>
          )}
        </p>
      </ConfirmationModal>
    </div>
  )
}

// ── Version thumbnail ───────────────────────────────────────────────────

interface VersionThumbnailProps {
  mimeType?: string
  isCurrent: boolean
  /** Empty-placeholder row for a soft-deleted moment in the object's history. */
  isDeleteMarker?: boolean
  size?: number
}

/**
 * A small rounded glyph identifying a version's file type, shown to the left
 * of every row and in the compare widget. Versions don't have their own
 * historical thumbnail in this prototype, so every noncurrent row shares the
 * same type-based glyph — the current version gets a distinct restore glyph
 * in brand color instead, matching the design handoff's convention. Delete
 * markers get their own struck-through glyph so they read as
 * "nothing there" at a glance.
 */
export const VersionThumbnail = ({
  mimeType,
  isCurrent,
  isDeleteMarker = false,
  size = 14,
}: VersionThumbnailProps) => (
  <span
    className={cn(
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
      isCurrent
        ? 'border-brand-400 bg-surface-200'
        : isDeleteMarker
          ? 'border-dashed border-strong bg-surface-100'
          : 'border-overlay bg-surface-100'
    )}
  >
    {isCurrent && <RotateCcw size={size} className="text-brand" />}
    {!isCurrent && isDeleteMarker && (
      <MinusCircle size={size} className="text-foreground-muted" />
    )}
    {!isCurrent && !isDeleteMarker && <MimeTypeIcon mimeType={mimeType} size={size} />}
  </span>
)

const MimeTypeIcon = ({ mimeType, size }: { mimeType?: string; size: number }) => {
  if (mimeType?.includes('image')) {
    return <ImageIcon size={size} className="text-foreground-lighter" />
  }
  if (mimeType?.includes('audio')) {
    return <Music size={size} className="text-foreground-lighter" />
  }
  if (mimeType?.includes('video')) {
    return <Film size={size} className="text-foreground-lighter" />
  }
  return <File size={size} className="text-foreground-lighter" />
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
  const isDeleteMarker = version.action === 'delete marker'
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
          {/* Delete markers are empty placeholders — download / get URL /
              restore don't apply, so the only action is permanently
              removing the marker itself. */}
          {!isDeleteMarker && (
            <>
              <DropdownMenuItem
                className="gap-x-2"
                onClick={() => toast.success(`Downloading ${label}`)}
              >
                <Download size={14} />
                Download version
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-x-2"
                onClick={() => toast.success(`Copied URL for ${label}`)}
              >
                <Copy size={14} />
                Get version URL
              </DropdownMenuItem>
              {!version.isCurrent && (
                <DropdownMenuItem className="gap-x-2" disabled={isRestoring} onClick={onRestore}>
                  <RotateCcw size={14} />
                  Restore as current
                </DropdownMenuItem>
              )}
              {!version.isCurrent && <DropdownMenuSeparator />}
            </>
          )}
          {!version.isCurrent && (
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-x-2 text-destructive focus:text-destructive"
            >
              <Trash2 size={14} />
              {isDeleteMarker ? 'Delete marker permanently' : 'Delete permanently'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Per-version fate label ──────────────────────────────────────────────

/**
 * The one line a row shows for its removal outlook. Never a hover-only
 * detail — the label itself is the state, per the "never promise a date
 * that isn't certain yet" rule in `computeVersionFate`.
 */
const VersionFateLabel = ({ fate }: { fate: VersionFate }) => {
  switch (fate.type) {
    // No date can be promised yet — showing "Kept" on every row that isn't
    // otherwise flagged just repeats what the absence of a warning already
    // says, so this state renders nothing.
    case 'kept':
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
          {fate.daysRemaining !== undefined && (
            <span className="shrink-0 text-xs text-warning-600">or in {fate.daysRemaining}d</span>
          )}
        </div>
      )
    case 'expiring-now':
      return <span className="shrink-0 text-xs text-destructive">Expiring now</span>
  }
}

// ── Policy row ───────────────────────────────────────────────────────────

interface PolicyRowProps {
  cap: number | null
  expiryDays: number | null
  mode: ExpirationMode
}

/**
 * Collapses the retention policy to one inline row: a broom-and-sparkles
 * icon, one or two mono chips (`30d`, `3 retained`), a greyscale BOTH/EITHER
 * chip only when both rules are configured, and an info icon whose tooltip
 * spells out the full rule and links to where the policy is set. One line
 * of plain-language explanation sits below it.
 */
const PolicyRow = ({ cap, expiryDays, mode }: PolicyRowProps) => {
  const hasCap = cap !== null && cap > 0
  const hasExpiryDays = expiryDays !== null && expiryDays > 0
  const hasBoth = hasCap && hasExpiryDays

  const [, setShowEditBucketModal] = useQueryState(
    'edit',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  return (
    <div className="space-y-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-x-2">
            <BroomSparklesIcon size={16} className="shrink-0 text-foreground-lighter mr-1" />
            <div className="flex items-center gap-x-1">
              {hasExpiryDays && <PolicyChip>{expiryDays}d</PolicyChip>}
              {hasBoth && <PolicyOperatorChip mode={mode} />}
              {hasCap && <PolicyChip>{cap} noncurrent v. retained</PolicyChip>}
            </div>
            {hasExpiryDays && !hasCap && (
              <span className="font-mono text-[11px] text-foreground-lighter">
                — no retention cap
              </span>
            )}
            {hasCap && !hasExpiryDays && (
              <span className="font-mono text-[11px] text-foreground-lighter">— no age limit</span>
            )}
            <Info size={13} className="text-foreground-lighter" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 space-y-1.5 pt-2.5">
          <div className="flex items-center gap-x-1">
            <BroomSparklesIcon size={16} className="shrink-0 mr-1" />
            <p className="font-medium text-foreground">Lifecycle policy</p>
          </div>
          <p className="text-foreground-light">
            <PolicyFullRule cap={cap} expiryDays={expiryDays} mode={mode} />
          </p>
          <Button variant="default" onClick={() => setShowEditBucketModal(true)}>
            View bucket settings
          </Button>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

// Shared chip styling so the day/retained tokens and the BOTH/EITHER operator
// badge all read as one family — same border, radius, padding and size.
// EITHER (the looser operator) is the only one that gets a dashed border.
const POLICY_CHIP_CLASSNAME = 'rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px]'

const PolicyChip = ({ children }: { children: ReactNode }) => (
  <span className={cn(POLICY_CHIP_CLASSNAME, 'border-strong bg-surface-300 text-foreground-light')}>
    {children}
  </span>
)

const PolicyOperatorChip = ({ mode }: { mode: ExpirationMode }) => (
  <span
    className={cn(
      POLICY_CHIP_CLASSNAME,
      'uppercase tracking-wide text-foreground-lighter border-dashed',
      mode === 'and' ? 'border-strong bg-surface-300' : 'border-strong'
    )}
  >
    {mode === 'and' ? 'Both' : 'Either'}
  </span>
)

const PolicyFullRule = ({ cap, expiryDays, mode }: PolicyRowProps) => {
  const hasCap = cap !== null && cap > 0
  const hasExpiryDays = expiryDays !== null && expiryDays > 0

  if (hasCap && hasExpiryDays) {
    return mode === 'and' ? (
      <>
        A noncurrent version is permanently deleted only once it's <em>both</em> older than{' '}
        {expiryDays} days and beyond the {cap} newest noncurrent versions.
      </>
    ) : (
      <>
        A noncurrent version is permanently deleted as soon as it's <em>either</em> older than{' '}
        {expiryDays} days <em>or</em> beyond the {cap} newest noncurrent versions.
      </>
    )
  }

  if (hasExpiryDays) {
    return <>A noncurrent version is permanently deleted once it's older than {expiryDays} days.</>
  }

  return (
    <>
      Only the {cap} newest noncurrent versions are kept. Older ones are deleted on the next upload.
    </>
  )
}
