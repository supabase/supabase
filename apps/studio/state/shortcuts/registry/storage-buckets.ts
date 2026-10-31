import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the Storage Files (bucket list) page.
 *
 * The shared list-page shortcuts (focus search, create new item) are reused
 * directly from `list-page.ts`. Only bucket-specific actions live here.
 */
export const STORAGE_BUCKETS_SHORTCUT_IDS = {
  STORAGE_BUCKETS_REFRESH: 'storage-buckets.refresh',
  STORAGE_BUCKETS_CLEAR_SORT: 'storage-buckets.clear-sort',
}

export type StorageBucketsShortcutId =
  (typeof STORAGE_BUCKETS_SHORTCUT_IDS)[keyof typeof STORAGE_BUCKETS_SHORTCUT_IDS]

export const storageBucketsRegistry: RegistryDefinations<StorageBucketsShortcutId> = {
  [STORAGE_BUCKETS_SHORTCUT_IDS.STORAGE_BUCKETS_REFRESH]: {
    id: STORAGE_BUCKETS_SHORTCUT_IDS.STORAGE_BUCKETS_REFRESH,
    label: 'Refresh buckets',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [STORAGE_BUCKETS_SHORTCUT_IDS.STORAGE_BUCKETS_CLEAR_SORT]: {
    id: STORAGE_BUCKETS_SHORTCUT_IDS.STORAGE_BUCKETS_CLEAR_SORT,
    label: 'Reset bucket sort',
    sequence: ['S', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
