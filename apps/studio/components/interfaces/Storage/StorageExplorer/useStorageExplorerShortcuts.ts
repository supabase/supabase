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
 * Handles refresh, deleting the current multi-select, and the Escape ladder
 * (selection → preview → search).
 */
export function useStorageExplorerShortcuts({ onClearSearch }: UseStorageExplorerShortcutsParams) {
  const {
    selectedItems,
    selectedFilePreview,
    isSearching,
    clearSelectedItems,
    setSelectedItemsToDelete,
    setSelectedFilePreview,
    refetchAllOpenedFolders,
  } = useStorageExplorerStateSnapshot()

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_REFRESH, () => {
    refetchAllOpenedFolders()
  })

  useShortcut(
    SHORTCUT_IDS.STORAGE_EXPLORER_DELETE_SELECTED,
    () => setSelectedItemsToDelete(selectedItems),
    { enabled: selectedItems.length > 0 }
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
