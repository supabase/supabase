import { PermissionAction } from '@supabase/shared-types/out/constants'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from 'ui'

import { bulkActionBarClassName } from '../StorageExplorer/storageExplorerChrome'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface TrashSelectionBarProps {
  count: number
  /** Selected objects a snapshot still pins — they can't be hard-deleted yet. */
  heldCount: number
  isRestoring: boolean
  onRestore: () => void
  onDelete: () => void
  onClear: () => void
}

/**
 * Bulk action bar for the Deleted files list, matching the file explorer's
 * selection chrome so the two lists behave the same way.
 */
export const TrashSelectionBar = ({
  count,
  heldCount,
  isRestoring,
  onRestore,
  onDelete,
  onClear,
}: TrashSelectionBarProps) => {
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const isEveryItemHeld = heldCount === count

  return (
    <div className={bulkActionBarClassName}>
      <span className="font-mono text-xs text-foreground-light">
        <span className="tabular-nums">{count}</span> version{count !== 1 ? 's' : ''} selected
      </span>

      {heldCount > 0 && (
        <span className="text-xs text-foreground-lighter">{heldCount} held by a snapshot</span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <ButtonTooltip
          variant="default"
          size="tiny"
          icon={<RotateCcw size={12} />}
          loading={isRestoring}
          disabled={!canUpdateFiles}
          onClick={onRestore}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canUpdateFiles
                ? 'You need additional permissions to restore versions'
                : undefined,
            },
          }}
        >
          Restore
        </ButtonTooltip>

        <ButtonTooltip
          variant="default"
          size="tiny"
          icon={<Trash2 size={12} />}
          disabled={!canUpdateFiles || isEveryItemHeld}
          onClick={onDelete}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canUpdateFiles
                ? 'You need additional permissions to delete versions'
                : isEveryItemHeld
                  ? 'Every selected version is held by a snapshot'
                  : undefined,
            },
          }}
        >
          Delete permanently
        </ButtonTooltip>

        <Button
          variant="text"
          size="tiny"
          icon={<X size={12} />}
          title="Clear selection"
          className="px-1.5 text-foreground-lighter hover:text-foreground"
          onClick={onClear}
        />
      </div>
    </div>
  )
}
