import { RegistryDefinations } from '../types'

export const DATABASE_TABLES_SHORTCUT_IDS = {
  DATABASE_TABLES_FOCUS_SCHEMA: 'database-tables.focus-schema',
  DATABASE_TABLES_FOCUS_SEARCH: 'database-tables.focus-search',
  DATABASE_TABLES_NEW_TABLE: 'database-tables.new-table',
  DATABASE_TABLES_RESET_FILTERS: 'database-tables.reset-filters',
}

export type DatabaseTablesShortcutId =
  (typeof DATABASE_TABLES_SHORTCUT_IDS)[keyof typeof DATABASE_TABLES_SHORTCUT_IDS]

export const databaseTablesRegistry: RegistryDefinations<DatabaseTablesShortcutId> = {
  [DATABASE_TABLES_SHORTCUT_IDS.DATABASE_TABLES_FOCUS_SCHEMA]: {
    id: DATABASE_TABLES_SHORTCUT_IDS.DATABASE_TABLES_FOCUS_SCHEMA,
    label: 'Open schema selector',
    sequence: ['O', 'S'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [DATABASE_TABLES_SHORTCUT_IDS.DATABASE_TABLES_FOCUS_SEARCH]: {
    id: DATABASE_TABLES_SHORTCUT_IDS.DATABASE_TABLES_FOCUS_SEARCH,
    label: 'Search tables',
    sequence: ['Shift+F'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_TABLES_SHORTCUT_IDS.DATABASE_TABLES_NEW_TABLE]: {
    id: DATABASE_TABLES_SHORTCUT_IDS.DATABASE_TABLES_NEW_TABLE,
    label: 'Create new table',
    sequence: ['Shift+N'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_TABLES_SHORTCUT_IDS.DATABASE_TABLES_RESET_FILTERS]: {
    id: DATABASE_TABLES_SHORTCUT_IDS.DATABASE_TABLES_RESET_FILTERS,
    label: 'Reset filters',
    sequence: ['F', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
