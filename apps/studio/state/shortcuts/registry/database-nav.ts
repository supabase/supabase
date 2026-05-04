import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Database sub-pages — `D + <letter>`.
 *
 * Active only while DatabaseLayout is mounted (i.e. the user is somewhere
 * under `/project/<ref>/database/*`). The chord intentionally lives on the
 * page rather than globally so the leading `D` doesn't burn a global key for
 * a destination most users only care about while already in the section.
 *
 */
export const DATABASE_NAV_SHORTCUT_IDS = {
  NAV_DATABASE_TABLES: 'nav.database-tables',
  NAV_DATABASE_FUNCTIONS: 'nav.database-functions',
  NAV_DATABASE_TRIGGERS: 'nav.database-triggers',
  NAV_DATABASE_INDEXES: 'nav.database-indexes',
  NAV_DATABASE_EXTENSIONS: 'nav.database-extensions',
  NAV_DATABASE_SCHEMA_VISUALIZER: 'nav.database-schema-visualizer',
  NAV_DATABASE_ROLES: 'nav.database-roles',
  NAV_DATABASE_BACKUPS: 'nav.database-backups',
  NAV_DATABASE_MIGRATIONS: 'nav.database-migrations',
}

export type DatabaseNavShortcutId =
  (typeof DATABASE_NAV_SHORTCUT_IDS)[keyof typeof DATABASE_NAV_SHORTCUT_IDS]

export const databaseNavRegistry: RegistryDefinations<DatabaseNavShortcutId> = {
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TABLES]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TABLES,
    label: 'Go to Tables',
    sequence: ['D', 'T'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS,
    label: 'Go to Functions',
    sequence: ['D', 'F'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TRIGGERS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TRIGGERS,
    label: 'Go to Triggers',
    sequence: ['D', 'R'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_INDEXES]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_INDEXES,
    label: 'Go to Indexes',
    sequence: ['D', 'I'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS,
    label: 'Go to Extensions',
    sequence: ['D', 'X'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_SCHEMA_VISUALIZER]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_SCHEMA_VISUALIZER,
    label: 'Go to Schema Visualizer',
    sequence: ['D', 'V'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_ROLES]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_ROLES,
    label: 'Go to Roles',
    sequence: ['D', 'O'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_BACKUPS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_BACKUPS,
    label: 'Go to Backups',
    sequence: ['D', 'B'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_MIGRATIONS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_MIGRATIONS,
    label: 'Go to Migrations',
    sequence: ['D', 'M'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
}
