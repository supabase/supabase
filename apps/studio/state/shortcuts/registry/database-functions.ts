import { RegistryDefinations } from '../types'

export const DATABASE_FUNCTIONS_SHORTCUT_IDS = {
  DATABASE_FUNCTIONS_FOCUS_SCHEMA: 'database-functions.focus-schema',
  DATABASE_FUNCTIONS_FOCUS_SEARCH: 'database-functions.focus-search',
  DATABASE_FUNCTIONS_NEW_FUNCTION: 'database-functions.new-function',
  DATABASE_FUNCTIONS_RESET_FILTERS: 'database-functions.reset-filters',
}

export type DatabaseFunctionsShortcutId =
  (typeof DATABASE_FUNCTIONS_SHORTCUT_IDS)[keyof typeof DATABASE_FUNCTIONS_SHORTCUT_IDS]

export const databaseFunctionsRegistry: RegistryDefinations<DatabaseFunctionsShortcutId> = {
  [DATABASE_FUNCTIONS_SHORTCUT_IDS.DATABASE_FUNCTIONS_FOCUS_SCHEMA]: {
    id: DATABASE_FUNCTIONS_SHORTCUT_IDS.DATABASE_FUNCTIONS_FOCUS_SCHEMA,
    label: 'Open schema selector',
    sequence: ['O', 'S'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [DATABASE_FUNCTIONS_SHORTCUT_IDS.DATABASE_FUNCTIONS_FOCUS_SEARCH]: {
    id: DATABASE_FUNCTIONS_SHORTCUT_IDS.DATABASE_FUNCTIONS_FOCUS_SEARCH,
    label: 'Search functions',
    sequence: ['Shift+F'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_FUNCTIONS_SHORTCUT_IDS.DATABASE_FUNCTIONS_NEW_FUNCTION]: {
    id: DATABASE_FUNCTIONS_SHORTCUT_IDS.DATABASE_FUNCTIONS_NEW_FUNCTION,
    label: 'Create new function',
    sequence: ['Shift+N'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_FUNCTIONS_SHORTCUT_IDS.DATABASE_FUNCTIONS_RESET_FILTERS]: {
    id: DATABASE_FUNCTIONS_SHORTCUT_IDS.DATABASE_FUNCTIONS_RESET_FILTERS,
    label: 'Reset filters',
    sequence: ['F', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
