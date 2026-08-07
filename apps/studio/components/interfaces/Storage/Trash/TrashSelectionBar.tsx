import { PermissionAction } from '@supabase/shared-types/out/constants'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

import { bulkActionBarClassName } from '../StorageExplorer/storageExplorerChrome'

interface TrashSelectionBarProps {
  count: number
  isRestoring: boolean
  onRestore: () => void
  onDelete: () => void
  onClear: () => void
}

export const TrashSelectionBar = ({
  count,
  isRestoring,
  onRestore,
  onDelete,
  onClear,
}: TrashSelectionBarProps) => {
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  return (
    <div className={bulkActionBarClassName}>
      <span className="font-mono text-xs text-foreground-light">
        <span className="tabular-nums">{count}</span> version{count !== 1 ? 's' : ''} selected
      </span>

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
          variant="danger"
          size="tiny"
          icon={<Trash2 size={12} />}
          disabled={!canUpdateFiles}
          onClick={onDelete}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canUpdateFiles
                ? 'You need additional permissions to delete versions'
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
