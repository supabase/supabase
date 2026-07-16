import { SHORTCUT_REFERENCE_GROUPS } from './referenceGroups'
import { ADVISORS_NAV_SHORTCUT_IDS, advisorsNavRegistry } from './registry/advisors-nav'
import { ADVISORS_PAGE_SHORTCUT_IDS, advisorsPageRegistry } from './registry/advisors-page'
import { API_KEYS_SHORTCUT_IDS, apiKeysRegistry } from './registry/api-keys'
import { AUTH_NAV_SHORTCUT_IDS, authNavRegistry } from './registry/auth-nav'
import { AUTH_USERS_SHORTCUT_IDS, authUsersRegistry } from './registry/auth-users'
import { DATABASE_NAV_SHORTCUT_IDS, databaseNavRegistry } from './registry/database-nav'
import { FUNCTIONS_DETAIL_SHORTCUT_IDS, functionsDetailRegistry } from './registry/functions-detail'
import {
  FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS,
  functionsDetailNavRegistry,
} from './registry/functions-detail-nav'
import { FUNCTIONS_LIST_SHORTCUT_IDS, functionsListRegistry } from './registry/functions-list'
import { FUNCTIONS_NAV_SHORTCUT_IDS, functionsNavRegistry } from './registry/functions-nav'
import {
  FUNCTIONS_OVERVIEW_SHORTCUT_IDS,
  functionsOverviewRegistry,
} from './registry/functions-overview'
import { JWT_KEYS_SHORTCUT_IDS, jwtKeysRegistry } from './registry/jwt-keys'
import { LIST_PAGE_SHORTCUT_IDS, listPageRegistry } from './registry/list-page'
import { LOG_DRAINS_SHORTCUT_IDS, logDrainsRegistry } from './registry/log-drains'
import { LOGS_PREVIEW_SHORTCUT_IDS, logsPreviewRegistry } from './registry/logs-preview'
import {
  OBSERVABILITY_NAV_SHORTCUT_IDS,
  observabilityNavRegistry,
} from './registry/observability-nav'
import {
  OBSERVABILITY_PAGE_SHORTCUT_IDS,
  observabilityPageRegistry,
} from './registry/observability-page'
import { ORG_AUDIT_LOGS_SHORTCUT_IDS, orgAuditLogsRegistry } from './registry/org-audit-logs'
import { ORG_INTEGRATIONS_SHORTCUT_IDS, orgIntegrationsRegistry } from './registry/org-integrations'
import { ORG_OAUTH_APPS_SHORTCUT_IDS, orgOAuthAppsRegistry } from './registry/org-oauth-apps'
import { ORG_PRIVATE_APPS_SHORTCUT_IDS, orgPrivateAppsRegistry } from './registry/org-private-apps'
import { ORG_PROJECTS_SHORTCUT_IDS, orgProjectsRegistry } from './registry/org-projects'
import { ORG_SETTINGS_NAV_SHORTCUT_IDS, orgSettingsNavRegistry } from './registry/org-settings-nav'
import { ORG_TEAM_SHORTCUT_IDS, orgTeamRegistry } from './registry/org-team'
import {
  PLATFORM_WEBHOOKS_SHORTCUT_IDS,
  platformWebhooksRegistry,
} from './registry/platform-webhooks'
import {
  PROJECT_SETTINGS_NAV_SHORTCUT_IDS,
  projectSettingsNavRegistry,
} from './registry/project-settings-nav'
import {
  REALTIME_INSPECTOR_SHORTCUT_IDS,
  realtimeInspectorRegistry,
} from './registry/realtime-inspector'
import { REALTIME_NAV_SHORTCUT_IDS, realtimeNavRegistry } from './registry/realtime-nav'
import {
  SCHEMA_VISUALIZER_SHORTCUT_IDS,
  schemaVisualizerRegistry,
} from './registry/schema-visualizer'
import { SQL_EDITOR_SHORTCUT_IDS, sqlEditorRegistry } from './registry/sql-editor'
import { STORAGE_BUCKETS_SHORTCUT_IDS, storageBucketsRegistry } from './registry/storage-buckets'
import { STORAGE_EXPLORER_SHORTCUT_IDS, storageExplorerRegistry } from './registry/storage-explorer'
import { STORAGE_NAV_SHORTCUT_IDS, storageNavRegistry } from './registry/storage-nav'
import { TABLE_EDITOR_SHORTCUT_IDS, tableEditorRegistry } from './registry/table-editor'
import { UNIFIED_LOGS_SHORTCUT_IDS, unifiedLogsRegistry } from './registry/unified-logs'
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
  AI_ASSISTANT_NEW_CHAT: 'ai-assistant.new-chat',
  AI_ASSISTANT_MAXIMIZE: 'ai-assistant.maximize',
  AI_ASSISTANT_COPY_CHAT_ID: 'ai-assistant.copy-chat-id',
  AI_ASSISTANT_TOGGLE_HISTORY: 'ai-assistant.toggle-history',
  AI_ASSISTANT_OPEN_PERMISSIONS: 'ai-assistant.open-permissions',
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
  CONNECT_OPEN_SHEET: 'connect.open-sheet',

  // Org settings sub-page navigation chords
  ...ORG_SETTINGS_NAV_SHORTCUT_IDS,
  // Org OAuth Apps page shortcuts
  ...ORG_OAUTH_APPS_SHORTCUT_IDS,
  // Org Team page shortcuts
  ...ORG_TEAM_SHORTCUT_IDS,
  // Org Integrations page shortcuts
  ...ORG_INTEGRATIONS_SHORTCUT_IDS,
  // Org Projects page shortcuts
  ...ORG_PROJECTS_SHORTCUT_IDS,
  // Org Private Apps page shortcuts
  ...ORG_PRIVATE_APPS_SHORTCUT_IDS,
  // Org Audit Logs page shortcuts
  ...ORG_AUDIT_LOGS_SHORTCUT_IDS,

  // Table editor shortcuts
  ...TABLE_EDITOR_SHORTCUT_IDS,

  // Unified Logs page shortcuts
  ...UNIFIED_LOGS_SHORTCUT_IDS,

  // SQL editor shortcuts
  ...SQL_EDITOR_SHORTCUT_IDS,

  // Schema visualizer shortcuts
  ...SCHEMA_VISUALIZER_SHORTCUT_IDS,

  // Shared list-page shortcuts (database/* listing pages, etc.)
  ...LIST_PAGE_SHORTCUT_IDS,

  // Database sub-page navigation chords
  ...DATABASE_NAV_SHORTCUT_IDS,

  // Auth users page shortcuts
  ...AUTH_USERS_SHORTCUT_IDS,
  // Auth sub-page navigation chords
  ...AUTH_NAV_SHORTCUT_IDS,

  // Storage sub-page navigation chords
  ...STORAGE_NAV_SHORTCUT_IDS,
  // Storage Files (bucket list) page shortcuts
  ...STORAGE_BUCKETS_SHORTCUT_IDS,
  // Storage Explorer (file browser) shortcuts
  ...STORAGE_EXPLORER_SHORTCUT_IDS,

  // Edge Functions sub-page navigation chords
  ...FUNCTIONS_NAV_SHORTCUT_IDS,
  // Edge Functions overview (list) page shortcuts
  ...FUNCTIONS_LIST_SHORTCUT_IDS,
  // Per-function detail layout shortcuts (header actions + test submit)
  ...FUNCTIONS_DETAIL_SHORTCUT_IDS,
  // Per-function detail tab navigation (digits)
  ...FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS,
  // Per-function Overview tab shortcuts (intervals, refresh, open logs)
  ...FUNCTIONS_OVERVIEW_SHORTCUT_IDS,

  // Realtime sub-page navigation chords
  ...REALTIME_NAV_SHORTCUT_IDS,
  // Realtime Inspector page shortcuts
  ...REALTIME_INSPECTOR_SHORTCUT_IDS,

  // Observability sub-page navigation chords
  ...OBSERVABILITY_NAV_SHORTCUT_IDS,
  // Observability shared page-action shortcuts
  ...OBSERVABILITY_PAGE_SHORTCUT_IDS,
  // Advisors sub-page navigation chords
  ...ADVISORS_NAV_SHORTCUT_IDS,
  // Advisors lint page shortcuts (tabs, refresh, close detail)
  ...ADVISORS_PAGE_SHORTCUT_IDS,

  // LogsPreviewer shortcuts (Function Logs, Function Invocations, Logs Explorer)
  ...LOGS_PREVIEW_SHORTCUT_IDS,

  // Platform Webhooks page shortcuts (org and project level)
  ...PLATFORM_WEBHOOKS_SHORTCUT_IDS,

  // Project Settings sub-page navigation chords and page actions
  ...PROJECT_SETTINGS_NAV_SHORTCUT_IDS,
  ...API_KEYS_SHORTCUT_IDS,
  ...JWT_KEYS_SHORTCUT_IDS,
  ...LOG_DRAINS_SHORTCUT_IDS,
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
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.GLOBAL_ACTIONS,
  },
  [SHORTCUT_IDS.INLINE_EDITOR_TOGGLE]: {
    id: SHORTCUT_IDS.INLINE_EDITOR_TOGGLE,
    label: 'Toggle inline SQL editor',
    sequence: ['Mod+E'],
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.GLOBAL_ACTIONS,
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
  [SHORTCUT_IDS.AI_ASSISTANT_NEW_CHAT]: {
    id: SHORTCUT_IDS.AI_ASSISTANT_NEW_CHAT,
    label: 'Start new chat',
    sequence: ['A', 'N'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.AI_ASSISTANT_MAXIMIZE]: {
    id: SHORTCUT_IDS.AI_ASSISTANT_MAXIMIZE,
    label: 'Maximize assistant',
    sequence: ['A', '='],
    showInSettings: false,
  },
  [SHORTCUT_IDS.AI_ASSISTANT_COPY_CHAT_ID]: {
    id: SHORTCUT_IDS.AI_ASSISTANT_COPY_CHAT_ID,
    label: 'Copy chat ID',
    sequence: ['A', 'C'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.AI_ASSISTANT_TOGGLE_HISTORY]: {
    id: SHORTCUT_IDS.AI_ASSISTANT_TOGGLE_HISTORY,
    label: 'Toggle chat history',
    sequence: ['A', 'Y'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.AI_ASSISTANT_OPEN_PERMISSIONS]: {
    id: SHORTCUT_IDS.AI_ASSISTANT_OPEN_PERMISSIONS,
    label: 'Permission settings',
    sequence: ['A', 'P'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.AI_ASSISTANT_CANCEL_EDIT]: {
    id: SHORTCUT_IDS.AI_ASSISTANT_CANCEL_EDIT,
    label: 'Cancel AI Assistant edit',
    sequence: ['Mod+Escape'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS]: {
    id: SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS,
    label: 'Toggle filter sidebar',
    sequence: ['Mod+B'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS]: {
    id: SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS,
    label: 'Reset filters',
    sequence: ['Mod+Escape'],
    showInSettings: false,
  },
  [SHORTCUT_IDS.DATA_TABLE_RESET_COLUMNS]: {
    id: SHORTCUT_IDS.DATA_TABLE_RESET_COLUMNS,
    label: 'Reset columns',
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
    sequence: ['G', ','],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  },
  [SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE]: {
    id: SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE,
    label: 'Show all keyboard shortcuts',
    // '?' isn't yet in @tanstack/hotkeys' PunctuationKey union (TanStack/hotkeys#19),
    // but matches correctly at runtime — event.key === '?' regardless of layout.
    // @ts-expect-error — remove this once upstream adds '?' to PunctuationKey.
    sequence: ['Shift+?'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [SHORTCUT_IDS.CONNECT_OPEN_SHEET]: {
    id: SHORTCUT_IDS.CONNECT_OPEN_SHEET,
    label: 'Open Connect sheet',
    sequence: ['O', 'C'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.GLOBAL_ACTIONS,
    options: { ignoreInputs: true },
  },

  // Org settings sub-page navigation chord registration
  ...orgSettingsNavRegistry,
  // Org OAuth Apps page shortcut registration
  ...orgOAuthAppsRegistry,
  // Org Team page shortcut registration
  ...orgTeamRegistry,
  // Org Integrations page shortcut registration
  ...orgIntegrationsRegistry,
  // Org Projects page shortcut registration
  ...orgProjectsRegistry,
  // Org Private Apps page shortcut registration
  ...orgPrivateAppsRegistry,
  // Org Audit Logs page shortcut registration
  ...orgAuditLogsRegistry,

  // Table editor shortcut registration
  ...tableEditorRegistry,

  // Unified Logs page shortcut registration
  ...unifiedLogsRegistry,

  // SQL editor shortcut registration
  ...sqlEditorRegistry,

  // Schema visualizer shortcut registration
  ...schemaVisualizerRegistry,

  // Shared list-page shortcut registration
  ...listPageRegistry,

  // Database sub-page navigation chord registration
  ...databaseNavRegistry,

  // Auth users page shortcut registration
  ...authUsersRegistry,
  // Auth sub-page navigation chord registration
  ...authNavRegistry,

  // Storage sub-page navigation chord registration
  ...storageNavRegistry,
  // Storage Files (bucket list) page shortcut registration
  ...storageBucketsRegistry,
  // Storage Explorer (file browser) shortcut registration
  ...storageExplorerRegistry,

  // Edge Functions sub-page navigation chord registration
  ...functionsNavRegistry,
  // Edge Functions overview (list) page shortcut registration
  ...functionsListRegistry,
  // Per-function detail layout shortcut registration
  ...functionsDetailRegistry,
  // Per-function detail tab navigation registration
  ...functionsDetailNavRegistry,
  // Per-function Overview tab shortcut registration
  ...functionsOverviewRegistry,

  // Realtime sub-page navigation chord registration
  ...realtimeNavRegistry,
  // Realtime Inspector page shortcut registration
  ...realtimeInspectorRegistry,

  // Observability sub-page navigation chord registration
  ...observabilityNavRegistry,
  // Observability shared page-action shortcut registration
  ...observabilityPageRegistry,
  // Advisors sub-page navigation chord registration
  ...advisorsNavRegistry,
  // Advisors lint page shortcut registration
  ...advisorsPageRegistry,

  // LogsPreviewer shortcut registration
  ...logsPreviewRegistry,

  // Platform Webhooks page shortcut registration
  ...platformWebhooksRegistry,

  // Project Settings sub-page navigation and page action shortcut registration
  ...projectSettingsNavRegistry,
  ...apiKeysRegistry,
  ...jwtKeysRegistry,
  ...logDrainsRegistry,
}
