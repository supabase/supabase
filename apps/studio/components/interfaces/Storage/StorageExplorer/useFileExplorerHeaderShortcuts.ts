import { RefObject } from 'react'

import { STORAGE_VIEWS } from '../Storage.constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseFileExplorerHeaderShortcutsParams {
  uploadButtonRef: RefObject<HTMLInputElement>
  searchInputRef: RefObject<HTMLInputElement>
  canUpdateStorage: boolean
  hasBreadcrumbs: boolean
  isSearching: boolean
  setIsSearching: (value: boolean) => void
  addNewFolderPlaceholder: (columnIndex: number) => void
  setView: (view: STORAGE_VIEWS) => void
}

export function useFileExplorerHeaderShortcuts({
  uploadButtonRef,
  searchInputRef,
  canUpdateStorage,
  hasBreadcrumbs,
  isSearching,
  setIsSearching,
  addNewFolderPlaceholder,
  setView,
}: UseFileExplorerHeaderShortcutsParams) {
  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      if (!isSearching) setIsSearching(true)
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      })
    },
    { label: 'Search files' }
  )

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_UPLOAD, () => uploadButtonRef.current?.click(), {
    enabled: canUpdateStorage && hasBreadcrumbs,
  })

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_NEW_FOLDER, () => addNewFolderPlaceholder(-1), {
    enabled: canUpdateStorage && hasBreadcrumbs,
  })

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_VIEW_COLUMNS, () => setView(STORAGE_VIEWS.COLUMNS))
  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_VIEW_LIST, () => setView(STORAGE_VIEWS.LIST))
}
