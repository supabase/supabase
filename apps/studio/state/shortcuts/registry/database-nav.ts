import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
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
  NAV_DATABASE_TYPES: 'nav.database-types',
  NAV_DATABASE_PUBLICATIONS: 'nav.database-publications',
  NAV_DATABASE_COLUMN_PRIVILEGES: 'nav.database-column-privileges',
  NAV_DATABASE_SETTINGS: 'nav.database-settings',
  NAV_DATABASE_REPLICATION: 'nav.database-replication',
}

export type DatabaseNavShortcutId =
  (typeof DATABASE_NAV_SHORTCUT_IDS)[keyof typeof DATABASE_NAV_SHORTCUT_IDS]

export const databaseNavRegistry: RegistryDefinations<DatabaseNavShortcutId> = {
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TABLES]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TABLES,
    label: 'Go to Tables',
    sequence: ['D', 'T'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_FUNCTIONS,
    label: 'Go to Functions',
    sequence: ['D', 'F'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TRIGGERS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TRIGGERS,
    label: 'Go to Triggers',
    sequence: ['D', 'R'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_INDEXES]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_INDEXES,
    label: 'Go to Indexes',
    sequence: ['D', 'I'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_EXTENSIONS,
    label: 'Go to Extensions',
    sequence: ['D', 'X'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_SCHEMA_VISUALIZER]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_SCHEMA_VISUALIZER,
    label: 'Go to Schema Visualizer',
    sequence: ['D', 'V'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_ROLES]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_ROLES,
    label: 'Go to Roles',
    sequence: ['D', 'O'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_BACKUPS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_BACKUPS,
    label: 'Go to Backups',
    sequence: ['D', 'B'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_MIGRATIONS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_MIGRATIONS,
    label: 'Go to Migrations',
    sequence: ['D', 'M'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TYPES]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_TYPES,
    label: 'Go to Enumerated Types',
    sequence: ['D', 'E'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_PUBLICATIONS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_PUBLICATIONS,
    label: 'Go to Publications',
    sequence: ['D', 'U'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_COLUMN_PRIVILEGES]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_COLUMN_PRIVILEGES,
    label: 'Go to Column Privileges',
    sequence: ['D', 'C'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_SETTINGS]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_SETTINGS,
    label: 'Go to Database Settings',
    sequence: ['D', ','],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
  [DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_REPLICATION]: {
    id: DATABASE_NAV_SHORTCUT_IDS.NAV_DATABASE_REPLICATION,
    label: 'Go to Replication',
    sequence: ['D', 'L'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_DATABASE,
  },
}
