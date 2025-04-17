export const LOCAL_STORAGE_KEYS = {
  // STUDIO
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

  SQL_SCRATCH_PAD_BANNER_ACKNOWLEDGED: 'supabase-sql-scratch-pad-banner-acknowledged',

  DASHBOARD_HISTORY: (ref: string) => `dashboard-history-${ref}`,

  SQL_EDITOR_INTELLISENSE: 'supabase_sql-editor-intellisense-enabled',
  SQL_EDITOR_SPLIT_SIZE: 'supabase_sql-editor-split-size',
  SQL_EDITOR_AI_PANEL_SPLIT_SIZE: 'supabase_sql-editor-ai-panel-split-size',
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
  PROJECT_LINT_IGNORE_LIST: 'supabase-project-lint-ignore-list',
  QUERY_PERF_SHOW_BOTTOM_SECTION: 'supabase-query-perf-show-bottom-section',
  // Key to track account deletion requests
  ACCOUNT_DELETION_REQUEST: 'supabase-account-deletion-request',
  // Used for storing a user id when sending reports to Sentry. The id is hashed for anonymity.
  SENTRY_USER_ID: 'supabase-sentry-user-id',
  // Used for storing the last sign in method used by the user
  LAST_SIGN_IN_METHOD: 'supabase-last-sign-in-method',
  // Key to track the last selected schema. The project ref is intentionally put at the end for easier search in the browser console.
  LAST_SELECTED_SCHEMA: (ref: string) => `last-selected-schema-${ref}`,
  // Key to show a warning on the SQL Editor AI Assistant that the org hasn't opted-in to sending anon data
  SHOW_AI_NOT_OPTIMIZED_WARNING: (ref: string) => `supabase-show-ai-not-optimized-${ref}`,
  // Track position of nodes for schema visualizer
  SCHEMA_VISUALIZER_POSITIONS: (ref: string, schemaId: number) =>
    `schema-visualizer-positions-${ref}-${schemaId}`,
  // Used for allowing the main nav panel to expand on hover
  EXPAND_NAVIGATION_PANEL: 'supabase-expand-navigation-panel',
  GITHUB_AUTHORIZATION_STATE: 'supabase-github-authorization-state',
  // Notice banner keys
  FLY_POSTGRES_DEPRECATION_WARNING: 'fly-postgres-deprecation-warning-dismissed',

  AUTH_USERS_COLUMNS_CONFIGURATION: (ref: string) => `supabase-auth-users-columns-${ref}`,
  STORAGE_BUCKETS_COLUMN_CONFIG: (ref: string) => `supabase-storage-buckets-columns-${ref}`,

  // api keys view switcher for new and legacy api keys
  API_KEYS_VIEW: (ref: string) => `supabase-api-keys-view-${ref}`,

  // last visited logs page
  LAST_VISITED_LOGS_PAGE: 'supabase-last-visited-logs-page',
  LAST_VISITED_ORGANIZATION: 'last-visited-organization',

  // COMMON
  TELEMETRY_CONSENT: 'supabase-consent-ph',
  TELEMETRY_DATA: 'supabase-telemetry-data',

  // DOCS
  HIDE_PROMO_TOAST: 'supabase-hide-promo-toast-lw13-d1',

  // WWW
  BLOG_VIEW: 'supabase-blog-view',
}

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
]

export function clearLocalStorage() {
  for (const key in localStorage) {
    if (!LOCAL_STORAGE_KEYS_ALLOWLIST.includes(key)) {
      localStorage.removeItem(key)
    }
  }
}
