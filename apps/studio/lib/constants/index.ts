export * from './infrastructure'

export const IS_PLATFORM = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
export const DEFAULT_HOME = IS_PLATFORM ? '/projects' : '/project/default'
export const API_URL = IS_PLATFORM ? process.env.NEXT_PUBLIC_API_URL : '/api'
export const API_ADMIN_URL = IS_PLATFORM ? process.env.NEXT_PUBLIC_API_ADMIN_URL : undefined
export const PG_META_URL = IS_PLATFORM
  ? process.env.PLATFORM_PG_META_URL
  : process.env.STUDIO_PG_META_URL
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * @deprecated use DATETIME_FORMAT
 */
export const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ'

// should be used for all dayjs formattings shown to the user. Includes timezone info.
export const DATETIME_FORMAT = 'DD MMM YYYY, HH:mm:ss (ZZ)'

export const GOTRUE_ERRORS = {
  UNVERIFIED_GITHUB_USER: 'Error sending confirmation mail',
}

export const STRIPE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_XVwg5IZH3I9Gti98hZw6KRzd00v5858heG'

export const USAGE_APPROACHING_THRESHOLD = 0.75

export const LOCAL_STORAGE_KEYS = {
  RECENTLY_VISITED_ORGANIZATION: 'supabase-organization',
  TELEMETRY_CONSENT: 'supabase-consent',
  UI_PREVIEW_NAVIGATION_LAYOUT: 'supabase-ui-preview-nav-layout',
  UI_PREVIEW_API_SIDE_PANEL: 'supabase-ui-api-side-panel',
  UI_PREVIEW_RLS_AI_ASSISTANT: 'supabase-ui-rls-ai-assistant',
  DASHBOARD_HISTORY: (ref: string) => `dashboard-history-${ref}`,
  UI_PREVIEW_CLS: 'supabase-ui-cls',

  SQL_EDITOR_SPLIT_SIZE: 'supabase_sql-editor-split-size',
  GRAPHIQL_RLS_BYPASS_WARNING: 'graphiql-rls-bypass-warning-dismissed',
  CLS_DIFF_WARNING: 'cls-diff-warning-dismissed',
  CLS_SELECT_STAR_WARNING: 'cls-select-star-warning-dismissed',
  PGBOUNCER_DEPRECATION_WARNING: 'pgbouncer-deprecation-warning-dismissed',
}

export const OPT_IN_TAGS = {
  AI_SQL: 'AI_SQL_GENERATOR_OPT_IN',
  PREVIEW_BRANCHES: 'PREVIEW_BRANCHES_OPT_IN',
}

export const GB = 1024 * 1024 * 1024
