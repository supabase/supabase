export const LOCAL_STORAGE_KEYS = {
  // Global
  TELEMETRY_CONSENT: 'supabase-consent',

  // Studio
  ACCOUNT_DELETION_REQUEST: 'supabase-account-deletion-request', // Key to track account deletion requests
  CLS_DIFF_WARNING: 'cls-diff-warning-dismissed',
  CLS_SELECT_STAR_WARNING: 'cls-select-star-warning-dismissed',
  DASHBOARD_HISTORY: (ref: string) => `dashboard-history-${ref}`,
  GRAPHIQL_RLS_BYPASS_WARNING: 'graphiql-rls-bypass-warning-dismissed',
  RECENTLY_VISITED_ORGANIZATION: 'supabase-organization',
  LAST_SIGN_IN_METHOD: 'supabase-last-sign-in-method', // Used for storing the last sign in method used by the user
  LAST_SELECTED_SCHEMA: (ref: string) => `last-selected-schema-${ref}`, // Key to track the last selected schema. The project ref is intentionally put at the end for easier search in the browser console.
  LOG_EXPLORER_SPLIT_SIZE: 'supabase_log-explorer-split-size',
  UI_PREVIEW_NAVIGATION_LAYOUT: 'supabase-ui-preview-nav-layout',
  UI_PREVIEW_API_SIDE_PANEL: 'supabase-ui-api-side-panel',
  UI_PREVIEW_RLS_AI_ASSISTANT: 'supabase-ui-rls-ai-assistant',
  UI_PREVIEW_CLS: 'supabase-ui-cls',
  PGBOUNCER_IPV6_DEPRECATION_WARNING: 'pgbouncer-ipv6-deprecation-warning-dismissed',
  PGBOUNCER_DEPRECATION_WARNING: 'pgbouncer-deprecation-warning-dismissed',
  PROJECT_LINT_IGNORE_LIST: 'supabase-project-lint-ignore-list',
  QUERY_PERF_SHOW_BOTTOM_SECTION: 'supabase-query-perf-show-bottom-section',
  SENTRY_USER_ID: 'supabase-sentry-user-id', // Used for storing a user id when sending reports to Sentry. The id is hashed for anonymity.
  SQL_EDITOR_INTELLISENSE: 'supabase_sql-editor-intellisense-enabled',
  SQL_EDITOR_SPLIT_SIZE: 'supabase_sql-editor-split-size',
  SQL_EDITOR_AI_PANEL_SPLIT_SIZE: 'supabase_sql-editor-ai-panel-split-size',
  SQL_EDITOR_AI_SCHEMA: (ref: string) => `supabase_sql-editor-ai-schema-enabled-${ref}`, // Key to track which schemas are ok to be sent to AI. The project ref is intentionally put at the end for easier search in the browser console.
  SQL_EDITOR_AI_OPEN: 'supabase_sql-editor-ai-open',
  VERCEL_IPV6_DEPRECATION_WARNING: 'vercel-ipv6-deprecation-warning-dismissed',

  // Docs
  SAVED_BRANCH: 'docs.ui.user.selected.branch',
  SAVED_ORG: 'docs.ui.user.selected.org',
  SAVED_PROJECT: 'docs.ui.user.selected.project',

  // Www
  BLOG_VIEW: 'supabase-blog-view',
  HIDE_PROMO_TOAST: 'supabase-hide-promo-toast',
} as const
