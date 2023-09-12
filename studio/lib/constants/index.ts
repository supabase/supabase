export * from './infrastructure'
export * from './metrics'

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

// Keyboard Shortcuts Related
export const SHORTCUT_KEYS = {
  VIEW_ALL_SHORTCUTS: 'VIEW_ALL_SHORTCUTS',
  TOGGLE_FILTER_MENU: 'TOGGLE_FILTER_MENU',
  TOGGLE_SORT_MENU: 'TOGGLE_SORT_MENU',
  CLOSE_SIDE_PANEL: 'CLOSE_SIDE_PANEL',
  EDIT_CELL: 'EDIT_CELL',
  COPY_CELL: 'COPY_CELL',
  PASTE_CELL: 'PASTE_CELL',
  CREATE_ROW: 'CREATE_ROW',
  EDIT_ROW: 'EDIT_ROW',
  DELETE_ROW: 'DELETE_ROW',
  SCROLL_EDGES: 'SCROLL_EDGES',
}

export const GENERAL_SHORTCUTS = [
  {
    key: SHORTCUT_KEYS.VIEW_ALL_SHORTCUTS,
    name: 'View all shortcuts',
    keys: ['Shift+/'],
  },
  {
    key: SHORTCUT_KEYS.CLOSE_SIDE_PANEL,
    name: 'Close side panel',
    keys: ['Esc'],
  },
]

export const generateEditorShortcuts = (clientOS: string) => {
  const metaKey = clientOS === 'windows' ? 'Ctrl' : '⌘'
  return [
    {
      key: SHORTCUT_KEYS.EDIT_CELL,
      name: 'Edit current cell',
      keys: ['Enter'],
    },
    {
      key: SHORTCUT_KEYS.COPY_CELL,
      name: 'Copy value of current cell',
      keys: [`${metaKey}+C`],
    },
    {
      key: SHORTCUT_KEYS.PASTE_CELL,
      name: 'Paste value into current cell',
      keys: [`${metaKey}+V`],
    },
    {
      key: SHORTCUT_KEYS.CREATE_ROW,
      name: 'Create a new row',
      keys: ['Shift+Enter'],
    },
    {
      key: SHORTCUT_KEYS.SCROLL_EDGES,
      name: 'Scroll to edges of the table',
      keys: [`${metaKey}+↑`, `${metaKey}+→`, `${metaKey}+↓`, `${metaKey}+←`],
    },
  ]
}

export const POLICY_MODAL_VIEWS = {
  SELECTION: 'SELECTION',
  TEMPLATES: 'TEMPLATES',
  EDITOR: 'EDITOR',
  REVIEW: 'REVIEW',
}

export const GOTRUE_ERRORS = {
  UNVERIFIED_GITHUB_USER: 'Error sending confirmation mail',
}

export const STRIPE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_XVwg5IZH3I9Gti98hZw6KRzd00v5858heG'

export const USAGE_APPROACHING_THRESHOLD = 0.75

export const LOCAL_STORAGE_KEYS = {
  RECENTLY_VISITED_ORGANIZATION: 'supabase-organization',
}

export const OPT_IN_TAGS = {
  AI_SQL: 'AI_SQL_GENERATOR_OPT_IN',
  PREVIEW_BRANCHES: 'PREVIEW_BRANCHES_OPT_IN',
}
