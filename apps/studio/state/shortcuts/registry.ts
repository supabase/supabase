import { ShortcutDefinition } from './types'

/**
 * The canonical list of shortcut IDs. Add new shortcuts here first, then
 * register them in `SHORTCUT_DEFINITIONS` below.
 *
 * ID convention: `"<surface>.<action>"` in kebab-case, e.g. `"results.copy-markdown"`.
 * The `<surface>` groups related shortcuts (sql-editor, table-editor, results, etc).
 */
export const SHORTCUT_IDS = {
  RESULTS_COPY_MARKDOWN: 'results.copy-markdown',

  NAV_TABLE_EDITOR: 'nav.table-editor',
  NAV_SQL_EDITOR: 'nav.sql-editor',
  NAV_STORAGE: 'nav.storage',
  NAV_DATABASE: 'nav.database',
  NAV_AUTH: 'nav.auth',

  SHORTCUTS_OPEN_REFERENCE: 'shortcuts.open-reference',
} as const

/**
 * Union of all valid shortcut IDs. Use this as the `id` parameter type on any
 * hook or util that takes a shortcut reference.
 */
export type ShortcutId = (typeof SHORTCUT_IDS)[keyof typeof SHORTCUT_IDS]

/**
 * The shortcut registry — every shortcut the app knows about, keyed by
 * `ShortcutId`. The `Record` type ensures this map stays exhaustive: adding a
 * new entry to `SHORTCUT_IDS` without a matching definition here is a type error.
 *
 * See `ShortcutDefinition` for the shape of each entry.
 */
export const SHORTCUT_DEFINITIONS: Record<ShortcutId, ShortcutDefinition> = {
  [SHORTCUT_IDS.RESULTS_COPY_MARKDOWN]: {
    id: SHORTCUT_IDS.RESULTS_COPY_MARKDOWN,
    label: 'Copy results as Markdown',
    sequence: ['Mod+Shift+M'],
  },

  [SHORTCUT_IDS.NAV_TABLE_EDITOR]: {
    id: SHORTCUT_IDS.NAV_TABLE_EDITOR,
    label: 'Go to Table Editor',
    sequence: ['G', 'T'],
  },
  [SHORTCUT_IDS.NAV_SQL_EDITOR]: {
    id: SHORTCUT_IDS.NAV_SQL_EDITOR,
    label: 'Go to SQL Editor',
    sequence: ['G', 'E'],
  },
  [SHORTCUT_IDS.NAV_STORAGE]: {
    id: SHORTCUT_IDS.NAV_STORAGE,
    label: 'Go to Storage',
    sequence: ['G', 'S'],
  },
  [SHORTCUT_IDS.NAV_DATABASE]: {
    id: SHORTCUT_IDS.NAV_DATABASE,
    label: 'Go to Database',
    sequence: ['G', 'D'],
  },
  [SHORTCUT_IDS.NAV_AUTH]: {
    id: SHORTCUT_IDS.NAV_AUTH,
    label: 'Go to Authentication',
    sequence: ['G', 'A'],
  },

  [SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE]: {
    id: SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE,
    label: 'Show all keyboard shortcuts',
    sequence: ['Shift+A'],
  },
}
