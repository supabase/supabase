import { RefObject } from 'react'

import { STORAGE_VIEWS } from '../Storage.constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseFileExplorerHeaderShortcutsParams {
  uploadButtonRef: RefObject<HTMLInputElement | null>
  searchInputRef: RefObject<HTMLInputElement | null>
  canUpdateStorage: boolean
  hasBreadcrumbs: boolean
  addNewFolderPlaceholder: (columnIndex: number) => void
  setView: (view: STORAGE_VIEWS) => void
}

export function useFileExplorerHeaderShortcuts({
  uploadButtonRef,
  searchInputRef,
  canUpdateStorage,
  hasBreadcrumbs,
  addNewFolderPlaceholder,
  setView,
}: UseFileExplorerHeaderShortcutsParams) {
  const focusSearch = () => {
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }

  useShortcut(SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH, focusSearch, { label: 'Search files' })
  // The standard find combo lands here too, since searching the bucket is what people
  // reach for it to do. `Mod+F` fires inside inputs, so it also reselects the term.
  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_FOCUS_SEARCH, focusSearch)

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_UPLOAD, () => uploadButtonRef.current?.click(), {
    enabled: canUpdateStorage && hasBreadcrumbs,
  })

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_NEW_FOLDER, () => addNewFolderPlaceholder(-1), {
    enabled: canUpdateStorage && hasBreadcrumbs,
  })

  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_VIEW_COLUMNS, () => setView(STORAGE_VIEWS.COLUMNS))
  useShortcut(SHORTCUT_IDS.STORAGE_EXPLORER_VIEW_LIST, () => setView(STORAGE_VIEWS.LIST))
}
