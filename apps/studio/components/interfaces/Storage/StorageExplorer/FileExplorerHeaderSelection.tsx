import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download, Move, Trash2, X } from 'lucide-react'
import { Button } from 'ui'

import { MAX_ITEMS_PER_MOVE } from '../Storage.constants'
import { bulkActionBarClassName } from './storageExplorerChrome'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const getMoveTooltipText = ({
  canUpdateFiles,
  isOverMoveLimit,
  isMovingItems,
}: {
  canUpdateFiles: boolean
  isOverMoveLimit: boolean
  isMovingItems: boolean
}) => {
  if (!canUpdateFiles) return 'You need additional permissions to move files'
  if (isMovingItems) return 'A move is already in progress'
  if (isOverMoveLimit) return `Move up to ${MAX_ITEMS_PER_MOVE} items at a time`
  return undefined
}

export const FileExplorerHeaderSelection = () => {
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const {
    selectedItems,
    isMovingItems,
    downloadFile,
    downloadSelectedFiles,
    clearSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemsToMove,
  } = useStorageExplorerStateSnapshot()

  const count = selectedItems.length
  const isOverMoveLimit = count > MAX_ITEMS_PER_MOVE
  const canMoveSelection = canUpdateFiles && !isOverMoveLimit && !isMovingItems

  return (
    <div className={bulkActionBarClassName}>
      <span className="font-mono text-xs text-foreground-light">
        <span className="tabular-nums">{count}</span> item{count !== 1 ? 's' : ''} selected
      </span>

      <div className="ml-auto flex items-center gap-1">
        <ShortcutTooltip shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_DOWNLOAD_SELECTED} side="bottom">
          <Button
            size="tiny"
            icon={<Download size={12} />}
            onClick={async () => {
              if (selectedItems.length === 1) {
                await downloadFile(selectedItems[0])
              } else {
                await downloadSelectedFiles(selectedItems)
              }
            }}
          >
            Download
          </Button>
        </ShortcutTooltip>

        <ShortcutTooltip
          shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_DELETE_SELECTED}
          side="bottom"
          open={!canUpdateFiles ? false : undefined}
        >
          <ButtonTooltip
            size="tiny"
            icon={<Trash2 size={12} />}
            disabled={!canUpdateFiles}
            onClick={() => setSelectedItemsToDelete(selectedItems)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to delete files'
                  : undefined,
              },
            }}
          >
            Delete
          </ButtonTooltip>
        </ShortcutTooltip>

        <ShortcutTooltip
          shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_MOVE_SELECTED}
          side="bottom"
          open={!canMoveSelection ? false : undefined}
        >
          <ButtonTooltip
            size="tiny"
            icon={<Move size={12} />}
            disabled={!canMoveSelection}
            onClick={() => setSelectedItemsToMove(selectedItems)}
            tooltip={{
              content: {
                side: 'bottom',
                text: getMoveTooltipText({ canUpdateFiles, isOverMoveLimit, isMovingItems }),
              },
            }}
          >
            Move
          </ButtonTooltip>
        </ShortcutTooltip>

        <Button
          variant="text"
          size="tiny"
          icon={<X size={12} />}
          title="Clear selection"
          className="px-1.5 text-foreground-lighter hover:text-foreground"
          onClick={() => clearSelectedItems()}
        />
      </div>
    </div>
  )
}
