import { sortBy, concat } from 'lodash'

export * from './infrastructure'
export * from './metrics'

export const IS_PLATFORM = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
export const API_URL = IS_PLATFORM ? process.env.NEXT_PUBLIC_API_URL : '/api'
export const PG_META_URL = IS_PLATFORM
  ? process.env.PLATFORM_PG_META_URL
  : process.env.STUDIO_PG_META_URL

export const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ'

// Data types primarily for mapping icon in editor

export const NUMERICAL_TYPES = ['int2', 'int4', 'int8', 'float4', 'float8']
export const JSON_TYPES = ['json', 'jsonb']
export const TEXT_TYPES = ['text', 'varchar']
export const TIMESTAMP_TYPES = ['date', 'time', 'timestamp', 'timetz', 'timestamptz']
export const OTHER_DATA_TYPES = ['uuid', 'bool']
export const POSTGRES_DATA_TYPES = sortBy(
  concat(NUMERICAL_TYPES, JSON_TYPES, TEXT_TYPES, TIMESTAMP_TYPES, OTHER_DATA_TYPES)
)

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
