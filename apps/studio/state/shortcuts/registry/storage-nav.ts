import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Storage sub-pages — `S + <letter>`.
 *
 * Active only while StorageLayout is mounted (i.e. the user is somewhere under
 * `/project/<ref>/storage/*`). Mirrors the database-nav / auth-nav pattern: the
 * leading `S` is layout-scoped so it doesn't burn a global key.
 */
export const STORAGE_NAV_SHORTCUT_IDS = {
  NAV_STORAGE_FILES: 'nav.storage-files',
  NAV_STORAGE_ANALYTICS: 'nav.storage-analytics',
  NAV_STORAGE_VECTORS: 'nav.storage-vectors',
  NAV_STORAGE_S3: 'nav.storage-s3',
}

export type StorageNavShortcutId =
  (typeof STORAGE_NAV_SHORTCUT_IDS)[keyof typeof STORAGE_NAV_SHORTCUT_IDS]

export const storageNavRegistry: RegistryDefinations<StorageNavShortcutId> = {
  [STORAGE_NAV_SHORTCUT_IDS.NAV_STORAGE_FILES]: {
    id: STORAGE_NAV_SHORTCUT_IDS.NAV_STORAGE_FILES,
    label: 'Go to Files',
    sequence: ['S', 'F'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_STORAGE,
  },
  [STORAGE_NAV_SHORTCUT_IDS.NAV_STORAGE_ANALYTICS]: {
    id: STORAGE_NAV_SHORTCUT_IDS.NAV_STORAGE_ANALYTICS,
    label: 'Go to Analytics buckets',
    sequence: ['S', 'A'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_STORAGE,
  },
  [STORAGE_NAV_SHORTCUT_IDS.NAV_STORAGE_VECTORS]: {
    id: STORAGE_NAV_SHORTCUT_IDS.NAV_STORAGE_VECTORS,
    label: 'Go to Vector buckets',
    sequence: ['S', 'V'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_STORAGE,
  },
  [STORAGE_NAV_SHORTCUT_IDS.NAV_STORAGE_S3]: {
    id: STORAGE_NAV_SHORTCUT_IDS.NAV_STORAGE_S3,
    label: 'Go to S3 settings',
    sequence: ['S', '3'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_STORAGE,
  },
}
