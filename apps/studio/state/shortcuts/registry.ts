import { ShortcutDefinition } from './types'

/**
 * The canonical list of shortcut IDs. Add new shortcuts here first, then
 * register them in `SHORTCUT_DEFINITIONS` below.
 *
 * ID convention: `"<surface>.<action>"` in kebab-case, e.g. `"results.copy-markdown"`.
 * The `<surface>` groups related shortcuts (sql-editor, table-editor, results, etc).
 */
export const SHORTCUT_IDS = {
  COMMAND_MENU_OPEN: 'command-menu.open',
  AI_ASSISTANT_TOGGLE: 'ai-assistant.toggle',
  INLINE_EDITOR_TOGGLE: 'inline-editor.toggle',
  RESULTS_COPY_MARKDOWN: 'results.copy-markdown',
  RESULTS_COPY_JSON: 'results.copy-json',
  RESULTS_COPY_CSV: 'results.copy-csv',
  RESULTS_DOWNLOAD_CSV: 'results.download-csv',
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
  [SHORTCUT_IDS.COMMAND_MENU_OPEN]: {
    id: SHORTCUT_IDS.COMMAND_MENU_OPEN,
    label: 'Open command menu',
    sequence: ['Mod+K'],
  },
  [SHORTCUT_IDS.AI_ASSISTANT_TOGGLE]: {
    id: SHORTCUT_IDS.AI_ASSISTANT_TOGGLE,
    label: 'Toggle AI Assistant panel',
    sequence: ['Mod+I'],
  },
  [SHORTCUT_IDS.INLINE_EDITOR_TOGGLE]: {
    id: SHORTCUT_IDS.INLINE_EDITOR_TOGGLE,
    label: 'Toggle inline SQL editor',
    sequence: ['Mod+E'],
  },
  [SHORTCUT_IDS.RESULTS_COPY_MARKDOWN]: {
    id: SHORTCUT_IDS.RESULTS_COPY_MARKDOWN,
    label: 'Copy results as Markdown',
    sequence: ['Mod+Shift+M'],
  },
  [SHORTCUT_IDS.RESULTS_COPY_JSON]: {
    id: SHORTCUT_IDS.RESULTS_COPY_JSON,
    label: 'Copy results as JSON',
    sequence: ['Mod+Shift+J'],
  },
  [SHORTCUT_IDS.RESULTS_COPY_CSV]: {
    id: SHORTCUT_IDS.RESULTS_COPY_CSV,
    label: 'Copy results as CSV',
    sequence: ['Mod+Shift+C'],
  },
  [SHORTCUT_IDS.RESULTS_DOWNLOAD_CSV]: {
    id: SHORTCUT_IDS.RESULTS_DOWNLOAD_CSV,
    label: 'Download results as CSV',
    sequence: ['Mod+Shift+D'],
  },
}
