import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download, Move, Trash2, X } from 'lucide-react'
import { Button } from 'ui'

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

  return (
    <div className="z-10 flex h-[40px] items-center rounded-t-md bg-brand-400 px-2 py-1 shadow-sm in-data-[theme*=dark]:bg-brand-500">
      <Button
        icon={<X size={16} strokeWidth={2} />}
        type="text"
        onClick={() => clearSelectedItems()}
      />
      <div className="ml-1 flex items-center space-x-3">
        <p className="mb-0 text-sm text-foreground">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedItems.length}</span> items
          selected
        </p>
        <ShortcutTooltip shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_DOWNLOAD_SELECTED} side="bottom">
          <Button
            icon={<Download size={16} strokeWidth={2} />}
            type="primary"
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
        <div className="border-r border-green-900 py-3 opacity-50" />

        <ShortcutTooltip
          shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_DELETE_SELECTED}
          side="bottom"
          open={!canUpdateFiles ? false : undefined}
        >
          <ButtonTooltip
            icon={<Trash2 size={16} strokeWidth={2} />}
            type="primary"
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
            icon={<Move size={16} strokeWidth={2} />}
            type="primary"
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
      </div>
    </div>
  )
}
