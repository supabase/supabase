import dayjs from 'dayjs'
import { RotateCcw, X } from 'lucide-react'
import { Button } from 'ui'

import type { ArchivedVersionRow } from './archivedVersions.utils'
import { shortVersion } from './VersionHistory'
import { VersionThumbnail } from './VersionThumbnail'
import { formatBytes } from '@/lib/helpers'

interface ArchivedVersionRestoreWidgetProps {
  version: ArchivedVersionRow
  isRestoring: boolean
  onRestore: () => void
  onDismiss: () => void
}

// No side-by-side comparison: the whole file is archived, so there's no current
// version to sit beside.
export const ArchivedVersionRestoreWidget = ({
  version,
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

    <div className="flex items-center gap-x-2">
      <VersionThumbnail isCurrent={false} size={20} />
      <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground-light">
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
