import { RegistryDefinations } from '../types'

export const DATABASE_TRIGGERS_SHORTCUT_IDS = {
  DATABASE_TRIGGERS_FOCUS_SCHEMA: 'database-triggers.focus-schema',
  DATABASE_TRIGGERS_FOCUS_SEARCH: 'database-triggers.focus-search',
  DATABASE_TRIGGERS_NEW_TRIGGER: 'database-triggers.new-trigger',
  DATABASE_TRIGGERS_RESET_FILTERS: 'database-triggers.reset-filters',
}

export type DatabaseTriggersShortcutId =
  (typeof DATABASE_TRIGGERS_SHORTCUT_IDS)[keyof typeof DATABASE_TRIGGERS_SHORTCUT_IDS]

export const databaseTriggersRegistry: RegistryDefinations<DatabaseTriggersShortcutId> = {
  [DATABASE_TRIGGERS_SHORTCUT_IDS.DATABASE_TRIGGERS_FOCUS_SCHEMA]: {
    id: DATABASE_TRIGGERS_SHORTCUT_IDS.DATABASE_TRIGGERS_FOCUS_SCHEMA,
    label: 'Open schema selector',
    sequence: ['O', 'S'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [DATABASE_TRIGGERS_SHORTCUT_IDS.DATABASE_TRIGGERS_FOCUS_SEARCH]: {
    id: DATABASE_TRIGGERS_SHORTCUT_IDS.DATABASE_TRIGGERS_FOCUS_SEARCH,
    label: 'Search triggers',
    sequence: ['Shift+F'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_TRIGGERS_SHORTCUT_IDS.DATABASE_TRIGGERS_NEW_TRIGGER]: {
    id: DATABASE_TRIGGERS_SHORTCUT_IDS.DATABASE_TRIGGERS_NEW_TRIGGER,
    label: 'Create new trigger',
    sequence: ['Shift+N'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_TRIGGERS_SHORTCUT_IDS.DATABASE_TRIGGERS_RESET_FILTERS]: {
    id: DATABASE_TRIGGERS_SHORTCUT_IDS.DATABASE_TRIGGERS_RESET_FILTERS,
    label: 'Reset filters',
    sequence: ['F', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
