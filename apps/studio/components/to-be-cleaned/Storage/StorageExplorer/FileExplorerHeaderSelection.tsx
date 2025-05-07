import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download, Move, Trash2, X } from 'lucide-react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { Button } from 'ui'
import { downloadFile } from './StorageExplorer.utils'

const FileExplorerHeaderSelection = () => {
  const { ref: projectRef, bucketId } = useParams()
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const {
    selectedItems,
    downloadSelectedFiles,
    clearSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemsToMove,
  } = useStorageExplorerStateSnapshot()

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
              await downloadFile({ projectRef, bucketId, file: selectedItems[0] })
            } else {
              await downloadSelectedFiles(selectedItems)
            }
          }}
        >
          Download
        </Button>
        <div className="border-r border-green-900 py-3 opacity-50" />

        <ButtonTooltip
          icon={<Trash2 size={16} strokeWidth={2} />}
          type="primary"
          disabled={!canUpdateFiles}
          onClick={() => setSelectedItemsToDelete(selectedItems)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canUpdateFiles ? 'You need additional permissions to delete files' : undefined,
            },
          }}
        >
          Delete
        </ButtonTooltip>

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
      </div>
    </div>
  )
}

export default FileExplorerHeaderSelection
