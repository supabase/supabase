import { Download, Move, Trash2, X } from 'lucide-react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { Button, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

const FileExplorerHeaderSelection = () => {
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const storageExplorerStore = useStorageStore()
  const {
    selectedItems,
    downloadFile,
    downloadSelectedFiles,
    clearSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemsToMove,
  } = storageExplorerStore

  return (
    <div className="z-10 flex h-[40px] items-center rounded-t-md bg-brand-400 px-2 py-1 shadow [[data-theme*=dark]_&]:bg-brand-500">
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
        <div className="border-r border-green-900 py-3 opacity-50" />
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              icon={<Trash2 size={16} strokeWidth={2} />}
              type="primary"
              onClick={() => setSelectedItemsToDelete(selectedItems)}
            >
              Delete
            </Button>
          </TooltipTrigger_Shadcn_>
          {!canUpdateFiles && (
            <TooltipContent_Shadcn_ side="bottom">
              You need additional permissions to delete files
            </TooltipContent_Shadcn_>
          )}
        </Tooltip_Shadcn_>
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              icon={<Move size={16} strokeWidth={2} />}
              type="primary"
              onClick={() => setSelectedItemsToMove(selectedItems)}
            >
              Move
            </Button>
          </TooltipTrigger_Shadcn_>
          {!canUpdateFiles && (
            <TooltipContent_Shadcn_ side="bottom">
              You need additional permissions to move files
            </TooltipContent_Shadcn_>
          )}
        </Tooltip_Shadcn_>
      </div>
    </div>
  )
}

export default FileExplorerHeaderSelection
