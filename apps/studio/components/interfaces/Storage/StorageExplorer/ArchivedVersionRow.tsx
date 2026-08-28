import dayjs from 'dayjs'
import { MoreVertical, RotateCcw, Trash2 } from 'lucide-react'
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

import type { ArchivedVersionRow as ArchivedVersion } from './archivedVersions.utils'
import { shortVersion } from './VersionHistory'
import { VersionThumbnail } from './VersionThumbnail'
import { formatBytes } from '@/lib/helpers'

interface ArchivedVersionRowProps {
  version: ArchivedVersion
  isSelected: boolean
  canUpdateFiles: boolean
  isRestoring: boolean
  isDeleting: boolean
  onSelect: () => void
  onRestore: () => void
  onDelete: () => void
}

export const ArchivedVersionRow = ({
  version,
  isSelected,
  canUpdateFiles,
  isRestoring,
  isDeleting,
  onSelect,
  onRestore,
  onDelete,
}: ArchivedVersionRowProps) => (
  <li
    className={cn(
      'group -mx-2 flex items-center gap-x-2.5 rounded-md border border-transparent px-2 py-1.5',
      isSelected ? 'border-brand-500 bg-brand-200' : 'hover:bg-surface-200'
    )}
  >
    {/* A real button, so the actions menu isn't nested inside another control. */}
    <button
      type="button"
      tabIndex={0}
      className="flex min-w-0 flex-1 items-center gap-x-2.5 text-left"
      onClick={onSelect}
    >
      <VersionThumbnail isCurrent={false} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground group-hover:underline">
          {dayjs(version.createdAt).format('MMM D, HH:mm')}
        </span>
        <span className="block truncate font-mono text-xs text-foreground-lighter">
          {formatBytes(version.size)}
        </span>
      </span>
    </button>

    {version.wasCurrentAtArchive ? (
      <Badge variant="warning">Was current</Badge>
    ) : (
      <span className="shrink-0 font-mono text-xs text-foreground-lighter">
        {shortVersion(version.versionId)}
      </span>
    )}

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="text"
          size="tiny"
          className="px-1.5"
          icon={<MoreVertical size={14} />}
          aria-label={`Actions for version ${shortVersion(version.versionId)}`}
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
  </li>
)
