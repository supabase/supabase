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
  AI_ASSISTANT_CANCEL_EDIT: 'ai-assistant.cancel-edit',
  INLINE_EDITOR_TOGGLE: 'inline-editor.toggle',
  RESULTS_COPY_MARKDOWN: 'results.copy-markdown',
  RESULTS_COPY_JSON: 'results.copy-json',
  RESULTS_COPY_CSV: 'results.copy-csv',
  RESULTS_DOWNLOAD_CSV: 'results.download-csv',
  TABLE_EDITOR_JUMP_FIRST_ROW: 'table-editor.jump-first-row',
  TABLE_EDITOR_JUMP_LAST_ROW: 'table-editor.jump-last-row',
  TABLE_EDITOR_JUMP_FIRST_COL: 'table-editor.jump-first-col',
  TABLE_EDITOR_JUMP_LAST_COL: 'table-editor.jump-last-col',
  DATA_TABLE_TOGGLE_FILTERS: 'data-table.toggle-filters',
  DATA_TABLE_RESET_FILTERS: 'data-table.reset-filters',
  DATA_TABLE_RESET_COLUMNS: 'data-table.reset-columns',
  DATA_TABLE_TOGGLE_LIVE: 'data-table.toggle-live',
  ACTION_BAR_SAVE: 'action-bar.save',
  OPERATION_QUEUE_SAVE: 'operation-queue.save',
  OPERATION_QUEUE_TOGGLE: 'operation-queue.toggle',
  OPERATION_QUEUE_UNDO: 'operation-queue.undo',
  UNIFIED_LOGS_RESET_FOCUS: 'unified-logs.reset-focus',
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
  [SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_ROW]: {
    id: SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_ROW,
    label: 'Jump to first row',
    sequence: ['Mod+ArrowUp'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_ROW]: {
    id: SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_ROW,
    label: 'Jump to last row',
    sequence: ['Mod+ArrowDown'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_COL]: {
    id: SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_COL,
    label: 'Jump to first column',
    sequence: ['Mod+ArrowLeft'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_COL]: {
    id: SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_COL,
    label: 'Jump to last column',
    sequence: ['Mod+ArrowRight'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [SHORTCUT_IDS.AI_ASSISTANT_CANCEL_EDIT]: {
    id: SHORTCUT_IDS.AI_ASSISTANT_CANCEL_EDIT,
    label: 'Cancel AI Assistant edit',
    sequence: ['Mod+Escape'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS]: {
    id: SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS,
    label: 'Toggle data table filter controls',
    sequence: ['Mod+B'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS]: {
    id: SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS,
    label: 'Reset data table filters',
    sequence: ['Mod+Escape'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.DATA_TABLE_RESET_COLUMNS]: {
    id: SHORTCUT_IDS.DATA_TABLE_RESET_COLUMNS,
    label: 'Reset data table columns',
    sequence: ['Mod+U'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.DATA_TABLE_TOGGLE_LIVE]: {
    id: SHORTCUT_IDS.DATA_TABLE_TOGGLE_LIVE,
    label: 'Toggle live mode',
    sequence: ['Mod+J'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.ACTION_BAR_SAVE]: {
    id: SHORTCUT_IDS.ACTION_BAR_SAVE,
    label: 'Save form',
    sequence: ['Mod+Enter'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.OPERATION_QUEUE_SAVE]: {
    id: SHORTCUT_IDS.OPERATION_QUEUE_SAVE,
    label: 'Save pending table edits',
    sequence: ['Mod+S'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.OPERATION_QUEUE_TOGGLE]: {
    id: SHORTCUT_IDS.OPERATION_QUEUE_TOGGLE,
    label: 'Toggle operation queue panel',
    sequence: ['Mod+.'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.OPERATION_QUEUE_UNDO]: {
    id: SHORTCUT_IDS.OPERATION_QUEUE_UNDO,
    label: 'Undo latest table edit',
    sequence: ['Mod+Z'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.UNIFIED_LOGS_RESET_FOCUS]: {
    id: SHORTCUT_IDS.UNIFIED_LOGS_RESET_FOCUS,
    label: 'Reset focus in logs',
    sequence: ['Mod+.'],
    showInSettings: false,
  },
}
