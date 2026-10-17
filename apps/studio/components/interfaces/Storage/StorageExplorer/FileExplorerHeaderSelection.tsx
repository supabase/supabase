import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ArchiveIcon, DownloadIcon, MoveIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Button } from 'ui'

import { isVersioningActive } from '../StorageVersioning.constants'
import { bulkActionBarClassName } from './storageExplorerChrome'
import { useIsStorageVersioningEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const FileExplorerHeaderSelection = () => {
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const {
    selectedBucket,
    selectedItems,
    downloadFile,
    downloadSelectedFiles,
    clearSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemsToMove,
    setItemsToPurge,
  } = useStorageExplorerStateSnapshot()

  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()
  const canArchive = isStorageVersioningEnabled && isVersioningActive(selectedBucket)

  const count = selectedItems.length

  return (
    <div className={bulkActionBarClassName}>
      <span className="font-mono text-xs text-foreground-light">
        <span className="tabular-nums">{count}</span> item{count !== 1 ? 's' : ''} selected
      </span>

      <div className="ml-auto flex items-center gap-1">
        <ShortcutTooltip shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_DOWNLOAD_SELECTED} side="bottom">
          <Button
            size="tiny"
            icon={<DownloadIcon size={12} />}
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
            icon={canArchive ? <ArchiveIcon size={12} /> : <Trash2Icon size={12} />}
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
            {canArchive ? 'Archive' : 'Delete'}
          </ButtonTooltip>
        </ShortcutTooltip>
        {canArchive && (
          <ButtonTooltip
            size="tiny"
            icon={
              <Trash2Icon size={12} className={canUpdateFiles ? 'text-destructive' : undefined} />
            }
            disabled={!canUpdateFiles}
            onClick={() => setItemsToPurge(selectedItems)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateFiles
                  ? 'You need additional permissions to delete files'
                  : 'Deletes every version, leaving nothing to restore',
              },
            }}
          >
            Delete permanently
          </ButtonTooltip>
        )}

        <ShortcutTooltip
          shortcutId={SHORTCUT_IDS.STORAGE_EXPLORER_MOVE_SELECTED}
          side="bottom"
          open={!canUpdateFiles ? false : undefined}
        >
          <ButtonTooltip
            size="tiny"
            icon={<MoveIcon size={12} />}
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
          icon={<XIcon size={12} />}
          title="Clear selection"
          className="px-1.5 text-foreground-lighter hover:text-foreground"
          onClick={() => clearSelectedItems()}
        />
      </div>
    </div>
  )
}
