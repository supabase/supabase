import dayjs from 'dayjs'
import { ArrowRight, RotateCcw, X } from 'lucide-react'
import { Button } from 'ui'

import { VersionThumbnail } from './VersionThumbnail'
import type { ObjectVersion } from '@/data/storage/versioning/object-versions-query'
import { formatBytes } from '@/lib/helpers'

interface VersionCompareWidgetProps {
  mimeType?: string
  selectedVersion: ObjectVersion
  currentVersion?: ObjectVersion
  isRestoring: boolean
  onRestore: () => void
  onDismiss: () => void
}

/**
 * Takes over the top of the preview panel when a noncurrent version is selected:
 * comparison and restore confirmation in one, so there is no modal.
 */
export const VersionCompareWidget = ({
  mimeType,
  selectedVersion,
  currentVersion,
  isRestoring,
  onRestore,
  onDismiss,
}: VersionCompareWidgetProps) => (
  <div className="space-y-3 border-b border-overlay bg-brand-200/30 p-3">
    <div className="flex items-center gap-x-1.5">
      <RotateCcw size={13} className="shrink-0 text-brand" />
      <p className="truncate text-sm font-medium text-foreground">
        Restore v.{selectedVersion.versionId}?
      </p>
      <button
        type="button"
        className="ml-auto shrink-0 text-foreground-lighter transition-colors hover:text-foreground"
        onClick={onDismiss}
        aria-label="Cancel comparison"
      >
        <X size={13} />
      </button>
    </div>

    <div className="flex items-center gap-x-2">
      <div className="flex-1 space-y-1.5">
        <div className="flex h-24 items-center justify-center rounded-md border border-brand-400 bg-surface-200">
          <VersionThumbnail mimeType={mimeType} isCurrent={false} size={20} />
        </div>
        <p className="truncate text-center font-mono text-[11px] text-brand">
          {dayjs(selectedVersion.createdAt).format('MMM D')} · {formatBytes(selectedVersion.size)}
        </p>
      </div>
      <ArrowRight size={14} className="shrink-0 text-foreground-lighter" />
      <div className="flex-1 space-y-1.5">
        <div className="flex h-24 items-center justify-center rounded-md border border-overlay bg-surface-200">
          <VersionThumbnail mimeType={mimeType} isCurrent size={20} />
        </div>
        <p className="truncate text-center font-mono text-[11px] text-foreground-lighter">
          Current{currentVersion && <> · {formatBytes(currentVersion.size)}</>}
        </p>
      </div>
    </div>

    <Button
      variant="primary"
      block
      icon={<RotateCcw size={14} />}
      loading={isRestoring}
      onClick={onRestore}
    >
      Restore version as current
    </Button>

    <p className="text-xs leading-relaxed text-foreground-lighter">
      {currentVersion && <strong>{currentVersion.versionId} </strong>}becomes a noncurrent version —
      nothing is deleted.
    </p>
  </div>
)
