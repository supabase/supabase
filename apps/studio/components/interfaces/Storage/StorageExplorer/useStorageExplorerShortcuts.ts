import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

interface UseStorageExplorerShortcutsParams {
  onClearSearch: () => void
}

/**
 * Shortcuts mounted in the stable StorageExplorer parent — they remain active
 * regardless of whether the default header or the selection header is rendered.
 *
 * Handles refresh, multi-select actions (download, move, delete), and the
 * Escape ladder (selection → preview → search).
 */
export function useStorageExplorerShortcuts({ onClearSearch }: UseStorageExplorerShortcutsParams) {
  const {
    selectedItems,
    selectedFilePreview,
    isSearching,
    clearSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemsToMove,
    setSelectedFilePreview,
    downloadFile,
    downloadSelectedFiles,
    refreshAll,
  } = useStorageExplorerStateSnapshot()

  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_REFRESH, () => {
    refreshAll()
  })

  useShortcut(
    SHORTCUT_IDS.STORAGE_EXPLORER_DOWNLOAD_SELECTED,
    () => {
      if (selectedItems.length === 1) {
        downloadFile(selectedItems[0])
      } else {
        downloadSelectedFiles(selectedItems)
      }
    },
    { enabled: selectedItems.length > 0 }
  )

  useShortcut(
    SHORTCUT_IDS.STORAGE_EXPLORER_MOVE_SELECTED,
    () => setSelectedItemsToMove(selectedItems),
    { enabled: selectedItems.length > 0 && canUpdateFiles }
  )

  useShortcut(
    SHORTCUT_IDS.STORAGE_EXPLORER_DELETE_SELECTED,
    () => setSelectedItemsToDelete(selectedItems),
    { enabled: selectedItems.length > 0 && canUpdateFiles }
  )

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_EXIT_SELECTION, () => clearSelectedItems(), {
    enabled: selectedItems.length > 0,
  })

  useShortcut(
    SHORTCUT_IDS.STORAGE_EXPLORER_CLOSE_PREVIEW,
    () => setSelectedFilePreview(undefined),
    {
      enabled: selectedItems.length === 0 && !!selectedFilePreview,
    }
  )

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_CLOSE_SEARCH, onClearSearch, {
    enabled: selectedItems.length === 0 && !selectedFilePreview && isSearching,
  })
}
