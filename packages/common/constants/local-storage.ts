export const LOCAL_STORAGE_KEYS = {
  /**
   * STUDIO
   */
  AI_ASSISTANT_STATE: (projectRef: string | undefined) =>
    `supabase-ai-assistant-state-${projectRef}`,
  SIDEBAR_BEHAVIOR: 'supabase-sidebar-behavior',
  EDITOR_PANEL_STATE: 'supabase-editor-panel-state',

  UI_PREVIEW_API_SIDE_PANEL: 'supabase-ui-api-side-panel',
  UI_PREVIEW_CLS: 'supabase-ui-cls',
  UI_PREVIEW_INLINE_EDITOR: 'supabase-ui-preview-inline-editor',
  UI_ONBOARDING_NEW_PAGE_SHOWN: 'supabase-ui-onboarding-new-page-shown',
  UI_TABLE_EDITOR_TABS: 'supabase-ui-table-editor-tabs',
  UI_SQL_EDITOR_TABS: 'supabase-ui-sql-editor-tabs',
  UI_NEW_LAYOUT_PREVIEW: 'supabase-ui-new-layout-preview',
  NEW_LAYOUT_NOTICE_ACKNOWLEDGED: 'new-layout-notice-acknowledge',
  TABS_INTERFACE_ACKNOWLEDGED: 'tabs-interface-acknowledge',

  DASHBOARD_HISTORY: (ref: string) => `dashboard-history-${ref}`,
  STORAGE_PREFERENCE: (ref: string) => `storage-explorer-${ref}`,

  SQL_EDITOR_INTELLISENSE: 'supabase_sql-editor-intellisense-enabled',
  SQL_EDITOR_SPLIT_SIZE: 'supabase_sql-editor-split-size',
  // Key to track which schemas are ok to be sent to AI. The project ref is intentionally put at the end for easier search in the browser console.
  SQL_EDITOR_AI_SCHEMA: (ref: string) => `supabase_sql-editor-ai-schema-enabled-${ref}`,
  SQL_EDITOR_AI_OPEN: 'supabase_sql-editor-ai-open',
  SQL_EDITOR_LAST_SELECTED_DB: (ref: string) => `sql-editor-last-selected-db-${ref}`,
  SQL_EDITOR_SQL_BLOCK_ACKNOWLEDGED: (ref: string) => `sql-editor-sql-block-acknowledged-${ref}`,
  SQL_EDITOR_SECTION_STATE: (ref: string) => `sql-editor-section-state-${ref}`,
  SQL_EDITOR_SORT: (ref: string) => `sql-editor-sort-${ref}`,

  LOG_EXPLORER_SPLIT_SIZE: 'supabase_log-explorer-split-size',
  GRAPHIQL_RLS_BYPASS_WARNING: 'graphiql-rls-bypass-warning-dismissed',
  CLS_DIFF_WARNING: 'cls-diff-warning-dismissed',
  CLS_SELECT_STAR_WARNING: 'cls-select-star-warning-dismissed',
  QUERY_PERF_SHOW_BOTTOM_SECTION: 'supabase-query-perf-show-bottom-section',
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
  AUTH_USERS_COLUMNS_CONFIGURATION: (ref: string) => `supabase-auth-users-columns-${ref}`,

  // api keys view switcher for new and legacy api keys
  API_KEYS_VIEW: (ref: string) => `supabase-api-keys-view-${ref}`,

  // last visited logs page
  LAST_VISITED_LOGS_PAGE: 'supabase-last-visited-logs-page',
  LAST_VISITED_ORGANIZATION: 'last-visited-organization',

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

  HIDE_PROMO_TOAST: 'supabase-hide-promo-toast-lw13-d1',

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
  LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS,
  LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS,
  LOCAL_STORAGE_KEYS.UI_NEW_LAYOUT_PREVIEW,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
  LOCAL_STORAGE_KEYS.UI_PREVIEW_CLS,
  LOCAL_STORAGE_KEYS.LAST_SIGN_IN_METHOD,
  LOCAL_STORAGE_KEYS.HIDE_PROMO_TOAST,
  LOCAL_STORAGE_KEYS.BLOG_VIEW,
]

export function clearLocalStorage() {
  for (const key in localStorage) {
    if (!LOCAL_STORAGE_KEYS_ALLOWLIST.includes(key)) {
      localStorage.removeItem(key)
    }
  }
}
