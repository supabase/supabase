export const SHORTCUT_REFERENCE_GROUPS = {
  NAVIGATION_GLOBAL: 'navigation.global',
  NAVIGATION_DATABASE: 'navigation.database',
} as const

export const SHORTCUT_REFERENCE_GROUP_LABELS: Record<string, string> = {
  [SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL]: 'Global Navigation',
  [SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE]: 'Database Navigation',
}

export const SHORTCUT_REFERENCE_GROUP_ORDER = [
  'command-menu',
  'shortcuts',
  SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL,
  SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  'nav',
  'ai-assistant',
  'inline-editor',
  'results',
  'data-table',
  'table-editor',
  'schema-visualizer',
  'list-page',
  'action-bar',
  'operation-queue',
  'unified-logs',
]
