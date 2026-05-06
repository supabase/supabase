import { SHORTCUT_REFERENCE_GROUPS } from './referenceGroups'
import { DATABASE_NAV_SHORTCUT_IDS, databaseNavRegistry } from './registry/database-nav'
import { LIST_PAGE_SHORTCUT_IDS, listPageRegistry } from './registry/list-page'
import {
  SCHEMA_VISUALIZER_SHORTCUT_IDS,
  schemaVisualizerRegistry,
} from './registry/schema-visualizer'
import { SQL_EDITOR_SHORTCUT_IDS, sqlEditorRegistry } from './registry/sql-editor'
import { TABLE_EDITOR_SHORTCUT_IDS, tableEditorRegistry } from './registry/table-editor'
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
  DATA_TABLE_TOGGLE_FILTERS: 'data-table.toggle-filters',
  DATA_TABLE_RESET_FILTERS: 'data-table.reset-filters',
  DATA_TABLE_RESET_COLUMNS: 'data-table.reset-columns',
  DATA_TABLE_TOGGLE_LIVE: 'data-table.toggle-live',
  ACTION_BAR_SAVE: 'action-bar.save',
  OPERATION_QUEUE_SAVE: 'operation-queue.save',
  OPERATION_QUEUE_TOGGLE: 'operation-queue.toggle',
  OPERATION_QUEUE_UNDO: 'operation-queue.undo',
  UNIFIED_LOGS_RESET_FOCUS: 'unified-logs.reset-focus',
  NAV_HOME: 'nav.home',
  NAV_TABLE_EDITOR: 'nav.table-editor',
  NAV_SQL_EDITOR: 'nav.sql-editor',
  NAV_DATABASE: 'nav.database',
  NAV_AUTH: 'nav.auth',
  NAV_STORAGE: 'nav.storage',
  NAV_FUNCTIONS: 'nav.functions',
  NAV_REALTIME: 'nav.realtime',
  NAV_ADVISORS: 'nav.advisors',
  NAV_OBSERVABILITY: 'nav.observability',
  NAV_LOGS: 'nav.logs',
  NAV_INTEGRATIONS: 'nav.integrations',
  NAV_SETTINGS: 'nav.settings',
  NAV_ORG_PROJECTS: 'nav.org-projects',
  NAV_ORG_TEAM: 'nav.org-team',
  NAV_ORG_INTEGRATIONS: 'nav.org-integrations',
  NAV_ORG_USAGE: 'nav.org-usage',
  NAV_ORG_BILLING: 'nav.org-billing',
  NAV_ORG_SETTINGS: 'nav.org-settings',
  SHORTCUTS_OPEN_REFERENCE: 'shortcuts.open-reference',

  // Table editor shortcuts
  ...TABLE_EDITOR_SHORTCUT_IDS,

  // SQL editor shortcuts
  ...SQL_EDITOR_SHORTCUT_IDS,

  // Schema visualizer shortcuts
  ...SCHEMA_VISUALIZER_SHORTCUT_IDS,

  // Shared list-page shortcuts (database/* listing pages, etc.)
  ...LIST_PAGE_SHORTCUT_IDS,

  // Database sub-page navigation chords
  ...DATABASE_NAV_SHORTCUT_IDS,
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
  [SHORTCUT_IDS.NAV_HOME]: {
    id: SHORTCUT_IDS.NAV_HOME,
    label: 'Go to Project Overview',
    sequence: ['G', 'H'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_TABLE_EDITOR]: {
    id: SHORTCUT_IDS.NAV_TABLE_EDITOR,
    label: 'Go to Table Editor',
    sequence: ['G', 'T'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_SQL_EDITOR]: {
    id: SHORTCUT_IDS.NAV_SQL_EDITOR,
    label: 'Go to SQL Editor',
    sequence: ['G', 'S'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_DATABASE]: {
    id: SHORTCUT_IDS.NAV_DATABASE,
    label: 'Go to Database',
    sequence: ['G', 'D'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_AUTH]: {
    id: SHORTCUT_IDS.NAV_AUTH,
    label: 'Go to Authentication',
    sequence: ['G', 'A'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_STORAGE]: {
    id: SHORTCUT_IDS.NAV_STORAGE,
    label: 'Go to Storage',
    sequence: ['G', 'B'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_FUNCTIONS]: {
    id: SHORTCUT_IDS.NAV_FUNCTIONS,
    label: 'Go to Edge Functions',
    sequence: ['G', 'F'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_REALTIME]: {
    id: SHORTCUT_IDS.NAV_REALTIME,
    label: 'Go to Realtime',
    sequence: ['G', 'R'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_ADVISORS]: {
    id: SHORTCUT_IDS.NAV_ADVISORS,
    label: 'Go to Advisors',
    sequence: ['G', 'V'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_OBSERVABILITY]: {
    id: SHORTCUT_IDS.NAV_OBSERVABILITY,
    label: 'Go to Observability',
    sequence: ['G', 'U'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_LOGS]: {
    id: SHORTCUT_IDS.NAV_LOGS,
    label: 'Go to Logs',
    sequence: ['G', 'L'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_INTEGRATIONS]: {
    id: SHORTCUT_IDS.NAV_INTEGRATIONS,
    label: 'Go to Integrations',
    sequence: ['G', 'I'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_SETTINGS]: {
    id: SHORTCUT_IDS.NAV_SETTINGS,
    label: 'Go to Project Settings',
    sequence: ['G', ','],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_ORG_PROJECTS]: {
    id: SHORTCUT_IDS.NAV_ORG_PROJECTS,
    label: 'Go to Projects',
    sequence: ['G', 'P'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_ORG_TEAM]: {
    id: SHORTCUT_IDS.NAV_ORG_TEAM,
    label: 'Go to Team',
    sequence: ['G', 'M'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_ORG_INTEGRATIONS]: {
    id: SHORTCUT_IDS.NAV_ORG_INTEGRATIONS,
    label: 'Go to Organization Integrations',
    sequence: ['G', 'I'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_ORG_USAGE]: {
    id: SHORTCUT_IDS.NAV_ORG_USAGE,
    label: 'Go to Usage',
    sequence: ['G', 'U'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_ORG_BILLING]: {
    id: SHORTCUT_IDS.NAV_ORG_BILLING,
    label: 'Go to Billing',
    sequence: ['G', 'B'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.NAV_ORG_SETTINGS]: {
    id: SHORTCUT_IDS.NAV_ORG_SETTINGS,
    label: 'Go to Organization Settings',
    sequence: ['G', 'O'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE]: {
    id: SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE,
    label: 'Show all keyboard shortcuts',
    sequence: ['Mod+/'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },

  // Table editor shortcut registration
  ...tableEditorRegistry,

  // SQL editor shortcut registration
  ...sqlEditorRegistry,

  // Schema visualizer shortcut registration
  ...schemaVisualizerRegistry,

  // Shared list-page shortcut registration
  ...listPageRegistry,

  // Database sub-page navigation chord registration
  ...databaseNavRegistry,
}
