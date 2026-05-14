export const SHORTCUT_REFERENCE_GROUPS = {
  NAVIGATION_GLOBAL: 'navigation.global',
  NAVIGATION_DATABASE: 'navigation.database',
  NAVIGATION_AUTH: 'navigation.auth',
  NAVIGATION_STORAGE: 'navigation.storage',
  NAVIGATION_FUNCTIONS: 'navigation.functions',
} as const

export const SHORTCUT_REFERENCE_GROUP_LABELS: Record<string, string> = {
  [SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL]: 'Global Navigation',
  [SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE]: 'Database Navigation',
  [SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH]: 'Auth Navigation',
  [SHORTCUT_REFERENCE_GROUPS.NAVIGATION_STORAGE]: 'Storage Navigation',
  [SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTIONS]: 'Edge Functions Navigation',
}

export const SHORTCUT_REFERENCE_GROUP_ORDER = [
  'command-menu',
  'shortcuts',
  SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  SHORTCUT_REFERENCE_GROUPS.NAVIGATION_AUTH,
  'auth-users',
  SHORTCUT_REFERENCE_GROUPS.NAVIGATION_STORAGE,
  'storage-buckets',
  'storage-explorer',
  SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTIONS,
  'functions-list',
  'nav',
  'ai-assistant',
  'inline-editor',
  'sql-editor',
  'results',
  'data-table',
  'table-editor',
  'schema-visualizer',
  'list-page',
  'action-bar',
  'operation-queue',
  'unified-logs',
]
