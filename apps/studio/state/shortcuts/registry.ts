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
 *
 * @example
 * // Add a new shortcut:
 * // 1. Add to SHORTCUT_IDS:
 * //    SQL_EDITOR_RUN: 'sql-editor.run'
 * // 2. Add to SHORTCUT_DEFINITIONS:
 * //    [SHORTCUT_IDS.SQL_EDITOR_RUN]: {
 * //      id: SHORTCUT_IDS.SQL_EDITOR_RUN,
 * //      label: 'Run query',
 * //      sequence: ['Mod+Enter'],
 * //    }
 * // 3. Use in a component:
 * //    useShortcut(SHORTCUT_IDS.SQL_EDITOR_RUN, runQuery)
 */
export const SHORTCUT_DEFINITIONS: Record<ShortcutId, ShortcutDefinition> = {
  [SHORTCUT_IDS.RESULTS_COPY_MARKDOWN]: {
    id: SHORTCUT_IDS.RESULTS_COPY_MARKDOWN,
    label: 'Copy results as Markdown',
    sequence: ['Mod+Shift+M'],
  },
}
