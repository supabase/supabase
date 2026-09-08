import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download, Move, Trash2, X } from 'lucide-react'
import { Button } from 'ui'

import { bulkActionBarClassName } from './storageExplorerChrome'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const FileExplorerHeaderSelection = () => {
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const {
    selectedItems,
    downloadFile,
    downloadSelectedFiles,
    clearSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemsToMove,
  } = useStorageExplorerStateSnapshot()

  const count = selectedItems.length

  return (
    <div className={bulkActionBarClassName}>
      <span className="font-mono text-xs text-foreground-light">
        <span className="tabular-nums">{count}</span> item{count !== 1 ? 's' : ''} selected
      </span>

      <div className="ml-auto flex items-center gap-1">
        <ShortcutTooltip shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_DOWNLOAD_SELECTED} side="bottom">
          <Button
            variant="default"
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
            variant="default"
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
          open={!canUpdateFiles ? false : undefined}
        >
          <ButtonTooltip
            variant="default"
            size="tiny"
            icon={<Move size={12} />}
            disabled={!canUpdateFiles}
            onClick={() => setSelectedItemsToMove(selectedItems)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles ? 'You need additional permissions to move files' : undefined,
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
