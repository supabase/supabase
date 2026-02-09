export const LOCAL_STORAGE_KEYS = {
  /**
   * STUDIO
   */
  AI_ASSISTANT_STATE: (projectRef: string | undefined) =>
    `supabase-ai-assistant-state-${projectRef}`,
  SIDEBAR_BEHAVIOR: 'supabase-sidebar-behavior',
  EDITOR_PANEL_STATE: 'supabase-editor-panel-state',
  PROJECTS_VIEW: 'projects-view',
  FEEDBACK_WIDGET_CONTENT: 'feedback-widget-content',
  FEEDBACK_WIDGET_SCREENSHOT: 'feedback-widget-screenshot',
  INCIDENT_BANNER_DISMISSED: (id: string) => `incident-banner-dismissed-${id}`,
  MAINTENANCE_BANNER_DISMISSED: (id: string) => `maintenance-banner-dismissed-${id}`,

  UI_PREVIEW_API_SIDE_PANEL: 'supabase-ui-api-side-panel',
  UI_PREVIEW_CLS: 'supabase-ui-cls',
  UI_PREVIEW_INLINE_EDITOR: 'supabase-ui-preview-inline-editor',
  UI_PREVIEW_UNIFIED_LOGS: 'supabase-ui-preview-unified-logs',
  UI_ONBOARDING_NEW_PAGE_SHOWN: 'supabase-ui-onboarding-new-page-shown',
  UI_PREVIEW_BRANCHING_2_0: 'supabase-ui-branching-2-0',
  UI_PREVIEW_ADVISOR_RULES: 'supabase-ui-advisor-rules',
  UI_PREVIEW_QUEUE_OPERATIONS: 'supabase-ui-queue-operations',
  UI_PREVIEW_TABLE_FILTER_BAR: 'supabase-ui-table-filter-bar',

  NEW_LAYOUT_NOTICE_ACKNOWLEDGED: 'new-layout-notice-acknowledge',
  TABS_INTERFACE_ACKNOWLEDGED: 'tabs-interface-acknowledge',
  AI_ASSISTANT_MCP_OPT_IN: 'ai-assistant-mcp-opt-in',

  DASHBOARD_HISTORY: (ref: string) => `dashboard-history-${ref}`,
  STORAGE_PREFERENCE: (ref: string) => `storage-explorer-${ref}`,

  AUTH_USERS_FILTER: (ref: string) => `auth-users-filter-${ref}`,
  AUTH_USERS_SORT_BY_VALUE: (ref: string) => `auth-users-sort-by-value-${ref}`,
  AUTH_USERS_COLUMNS_CONFIGURATION: (ref: string) => `supabase-auth-users-columns-${ref}`,
  AUTH_USERS_IMPROVED_SEARCH_DISMISSED: (ref: string) =>
    `auth-users-improved-search-dismissed-${ref}`,

  SQL_EDITOR_INTELLISENSE: 'supabase_sql-editor-intellisense-enabled',
  SQL_EDITOR_SPLIT_SIZE: 'supabase_sql-editor-split-size',
  // Key to track which schemas are ok to be sent to AI. The project ref is intentionally put at the end for easier search in the browser console.
  SQL_EDITOR_AI_SCHEMA: (ref: string) => `supabase_sql-editor-ai-schema-enabled-${ref}`,
  SQL_EDITOR_AI_OPEN: 'supabase_sql-editor-ai-open',
  SQL_EDITOR_LAST_SELECTED_DB: (ref: string) => `sql-editor-last-selected-db-${ref}`,
  SQL_EDITOR_SQL_BLOCK_ACKNOWLEDGED: (ref: string) => `sql-editor-sql-block-acknowledged-${ref}`,
  SQL_EDITOR_SECTION_STATE: (ref: string) => `sql-editor-section-state-${ref}`,
  SQL_EDITOR_SORT: (ref: string) => `sql-editor-sort-${ref}`,

  // Key to track if the user has acknowledged the security notifications preview
  SECURITY_NOTIFICATIONS_ACKNOWLEDGED: (ref: string) =>
    `security-notifications-acknowledged-${ref}`,

  LOG_EXPLORER_SPLIT_SIZE: 'supabase_log-explorer-split-size',
  GRAPHIQL_RLS_BYPASS_WARNING: 'graphiql-rls-bypass-warning-dismissed',
  CLS_DIFF_WARNING: 'cls-diff-warning-dismissed',
  CLS_SELECT_STAR_WARNING: 'cls-select-star-warning-dismissed',
  QUERY_PERF_SHOW_BOTTOM_SECTION: 'supabase-query-perf-show-bottom-section',
  LINTER_SHOW_FOOTER: 'supabase-linter-show-footer',
  // Key to track account deletion requests
  ACCOUNT_DELETION_REQUEST: 'supabase-account-deletion-request',
  // Used for storing a user id when sending reports to Sentry. The id is hashed for anonymity.
  SENTRY_USER_ID: 'supabase-sentry-user-id',
  // Used for storing the last sign in method used by the user
  LAST_SIGN_IN_METHOD: 'supabase-last-sign-in-method',
  // Key to track the last selected schema. The project ref is intentionally put at the end for easier search in the browser console.
  LAST_SELECTED_SCHEMA: (ref: string) => `last-selected-schema-${ref}`,
  // Track position of nodes for schema visualizer
  SCHEMA_VISUALIZER_POSITIONS: (ref: string, schemaId: number) =>
    `schema-visualizer-positions-${ref}-${schemaId}`,
  // Used for allowing the main nav panel to expand on hover
  EXPAND_NAVIGATION_PANEL: 'supabase-expand-navigation-panel',
  GITHUB_AUTHORIZATION_STATE: 'supabase-github-authorization-state',
  // Notice banner keys
  FLY_POSTGRES_DEPRECATION_WARNING: 'fly-postgres-deprecation-warning-dismissed',
  API_KEYS_FEEDBACK_DISMISSED: (ref: string) => `supabase-api-keys-feedback-dismissed-${ref}`,
  MAINTENANCE_WINDOW_BANNER: 'maintenance-window-banner-2026-01-16',
  REPORT_DATERANGE: 'supabase-report-daterange',

  // api keys view switcher for new and legacy api keys
  API_KEYS_VIEW: (ref: string) => `supabase-api-keys-view-${ref}`,

  LAST_VISITED_ORGANIZATION: 'last-visited-organization',

  // user impersonation selector previous searches
  USER_IMPERSONATION_SELECTOR_PREVIOUS_SEARCHES: (ref: string) =>
    `user-impersonation-selector-previous-searches-${ref}`,

  HOTKEY_COMMAND_MENU: 'supabase-dashboard-hotkey-command-menu',

  LAST_OPENED_SIDE_BAR: (ref: string) => `last-opened-sidebar-${ref}`,

  // Project sidebar hotkeys
  HOTKEY_SIDEBAR: (sidebarId: string) => `supabase-dashboard-hotkey-sidebar-${sidebarId}`,

  // Index Advisor notice dismissed
  INDEX_ADVISOR_NOTICE_DISMISSED: (ref: string) => `index-advisor-notice-dismissed-${ref}`,

  // RLS event trigger banner dismissed
  RLS_EVENT_TRIGGER_BANNER_DISMISSED: (ref: string) => `rls-event-trigger-banner-dismissed-${ref}`,

  // Observability banner dismissed
  OBSERVABILITY_BANNER_DISMISSED: (ref: string) => `observability-banner-dismissed-${ref}`,

  /**
   * COMMON
   */
  /** @deprecated – we're using usercentrics instead to handle telemetry consent */
  TELEMETRY_CONSENT: 'supabase-consent-ph',
  TELEMETRY_DATA: 'supabase-telemetry-data',

  /**
   * DOCS
   */
  SAVED_ORG: 'docs.ui.user.selected.org',
  SAVED_PROJECT: 'docs.ui.user.selected.project',
  SAVED_BRANCH: 'docs.ui.user.selected.branch',

  HIDE_PROMO_TOAST: 'supabase-hide-promo-toast-lw15-ticket',

  /**
   * WWW
   */
  BLOG_VIEW: 'supabase-blog-view',
} as const

export type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS]

const LOCAL_STORAGE_KEYS_ALLOWLIST = [
  'graphiql:theme',
  'theme',
  'supabaseDarkMode',
  'supabase.dashboard.auth.debug',
  'supabase.dashboard.auth.navigatorLock.disabled',
  LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_API_SIDE_PANEL,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_TABLE_FILTER_BAR,
  LOCAL_STORAGE_KEYS.LAST_SIGN_IN_METHOD,
  LOCAL_STORAGE_KEYS.HIDE_PROMO_TOAST,
  LOCAL_STORAGE_KEYS.BLOG_VIEW,
  LOCAL_STORAGE_KEYS.AI_ASSISTANT_MCP_OPT_IN,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_BRANCHING_2_0,
  LOCAL_STORAGE_KEYS.LINTER_SHOW_FOOTER,
  LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
]

export function clearLocalStorage() {
  for (const key in localStorage) {
    if (!LOCAL_STORAGE_KEYS_ALLOWLIST.includes(key)) {
      localStorage.removeItem(key)
    }
  }
}
