import dayjs from 'dayjs'
import { RotateCcw, X } from 'lucide-react'
import { Button } from 'ui'

import type { ArchivedVersionRow } from './archivedVersions.utils'
import { FilePreview } from './FilePreview'
import { shortVersion } from './VersionHistory'
import { formatBytes } from '@/lib/helpers'

interface ArchivedVersionRestoreWidgetProps {
  version: ArchivedVersionRow
  /** Full path within the bucket, which is what the version endpoints address. */
  path: string
  isRestoring: boolean
  onRestore: () => void
  onDismiss: () => void
}

// No side-by-side comparison: the whole file is archived, so nothing is current.
export const ArchivedVersionRestoreWidget = ({
  version,
  path,
  isRestoring,
  onRestore,
  onDismiss,
}: ArchivedVersionRestoreWidgetProps) => (
  <div className="space-y-3 border-b border-overlay bg-brand-200/30 p-3">
    <div className="flex items-center gap-x-1.5">
      <RotateCcw size={13} className="shrink-0 text-brand" />
      <p className="truncate text-sm font-medium text-foreground">
        Restore version {shortVersion(version.versionId)}?
      </p>
      <button
        type="button"
        tabIndex={0}
        className="ml-auto shrink-0 text-foreground-lighter transition-colors hover:text-foreground"
        onClick={onDismiss}
        aria-label="Cancel restore"
      >
        <X size={13} />
      </button>
    </div>

    <div className="space-y-1.5">
      <div className="flex h-24 items-center justify-center overflow-hidden rounded-md border border-brand-400 bg-surface-200">
        <FilePreview
          path={path}
          mimeType={version.mimeType}
          size={version.size}
          versionId={version.versionId}
        />
      </div>
      <p className="truncate text-center font-mono text-[11px] text-foreground-light">
        {dayjs(version.createdAt).format('MMM D, YYYY · HH:mm')} · {formatBytes(version.size)}
      </p>
    </div>

    <Button
      variant="primary"
      block
      icon={<RotateCcw size={14} />}
      loading={isRestoring}
      onClick={onRestore}
    >
      Restore as current version
    </Button>

    <p className="text-xs leading-relaxed text-foreground-lighter">
      The file leaves the archive and this becomes its current version. Every other retained version
      stays in its history.
    </p>
  </div>
)
