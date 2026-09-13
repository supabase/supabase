import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the Storage Explorer (file browser inside a bucket).
 *
 * `Shift+F` (focus search) is provided by the shared `LIST_PAGE_FOCUS_SEARCH`
 * shortcut and reused here via a contextual `label` override.
 */
export const STORAGE_EXPLORER_SHORTCUT_IDS = {
  STORAGE_EXPLORER_REFRESH: 'storage-explorer.refresh',
  STORAGE_EXPLORER_UPLOAD: 'storage-explorer.upload',
  STORAGE_EXPLORER_NEW_FOLDER: 'storage-explorer.new-folder',
  STORAGE_EXPLORER_VIEW_COLUMNS: 'storage-explorer.view-columns',
  STORAGE_EXPLORER_VIEW_LIST: 'storage-explorer.view-list',
  STORAGE_EXPLORER_DOWNLOAD_SELECTED: 'storage-explorer.download-selected',
  STORAGE_EXPLORER_MOVE_SELECTED: 'storage-explorer.move-selected',
  STORAGE_EXPLORER_DELETE_SELECTED: 'storage-explorer.delete-selected',
  STORAGE_EXPLORER_EXIT_SELECTION: 'storage-explorer.exit-selection',
  STORAGE_EXPLORER_CLOSE_PREVIEW: 'storage-explorer.close-preview',
  STORAGE_EXPLORER_CLOSE_SEARCH: 'storage-explorer.close-search',
}

export type StorageExplorerShortcutId =
  (typeof STORAGE_EXPLORER_SHORTCUT_IDS)[keyof typeof STORAGE_EXPLORER_SHORTCUT_IDS]

export const storageExplorerRegistry: RegistryDefinations<StorageExplorerShortcutId> = {
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_REFRESH]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_REFRESH,
    label: 'Refresh',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_UPLOAD]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_UPLOAD,
    label: 'Upload files',
    sequence: ['I', 'F'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_NEW_FOLDER]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_NEW_FOLDER,
    label: 'Create folder',
    sequence: ['I', 'N'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_VIEW_COLUMNS]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_VIEW_COLUMNS,
    label: 'View as columns',
    sequence: ['V', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_VIEW_LIST]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_VIEW_LIST,
    label: 'View as list',
    sequence: ['V', 'L'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_DOWNLOAD_SELECTED]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_DOWNLOAD_SELECTED,
    label: 'Download selected items',
    sequence: ['Shift+D'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_MOVE_SELECTED]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_MOVE_SELECTED,
    label: 'Move selected items',
    sequence: ['Shift+M'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_DELETE_SELECTED]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_DELETE_SELECTED,
    label: 'Delete selected items',
    sequence: ['Mod+Backspace'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_EXIT_SELECTION]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_EXIT_SELECTION,
    label: 'Clear item selection',
    sequence: ['Escape'],
    showInSettings: false,
    options: { conflictBehavior: 'allow' },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_CLOSE_PREVIEW]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_CLOSE_PREVIEW,
    label: 'Close file preview',
    sequence: ['Escape'],
    showInSettings: false,
    options: { conflictBehavior: 'allow' },
  },
  [STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_CLOSE_SEARCH]: {
    id: STORAGE_EXPLORER_SHORTCUT_IDS.STORAGE_EXPLORER_CLOSE_SEARCH,
    label: 'Close search',
    sequence: ['Escape'],
    showInSettings: false,
    options: { conflictBehavior: 'allow' },
  },
}
