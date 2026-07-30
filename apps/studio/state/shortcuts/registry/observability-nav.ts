import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Observability sub-pages — `U + <letter>`.
 *
 * Active only while ObservabilityLayout is mounted (i.e. the user is somewhere
 * under `/project/<ref>/observability/*`). Mirrors the database-nav pattern:
 * the leading `U` is layout-scoped so it doesn't burn a global key. `U` matches
 * the global `G U` that takes the user into Observability in the first place.
 */
export const OBSERVABILITY_NAV_SHORTCUT_IDS = {
  NAV_OBSERVABILITY_OVERVIEW: 'nav.observability-overview',
  NAV_OBSERVABILITY_QUERY_PERFORMANCE: 'nav.observability-query-performance',
  NAV_OBSERVABILITY_API_GATEWAY: 'nav.observability-api-gateway',
  NAV_OBSERVABILITY_CONNECTIONS: 'nav.observability-connections',
  NAV_OBSERVABILITY_DATABASE: 'nav.observability-database',
  NAV_OBSERVABILITY_DATA_API: 'nav.observability-data-api',
  NAV_OBSERVABILITY_AUTH: 'nav.observability-auth',
  NAV_OBSERVABILITY_FUNCTIONS: 'nav.observability-functions',
  NAV_OBSERVABILITY_STORAGE: 'nav.observability-storage',
  NAV_OBSERVABILITY_REALTIME: 'nav.observability-realtime',
}

export type ObservabilityNavShortcutId =
  (typeof OBSERVABILITY_NAV_SHORTCUT_IDS)[keyof typeof OBSERVABILITY_NAV_SHORTCUT_IDS]

export const observabilityNavRegistry: RegistryDefinations<ObservabilityNavShortcutId> = {
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_OVERVIEW]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_OVERVIEW,
    label: 'Go to Overview',
    sequence: ['U', 'O'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_QUERY_PERFORMANCE]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_QUERY_PERFORMANCE,
    label: 'Go to Query Performance',
    sequence: ['U', 'Q'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_API_GATEWAY]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_API_GATEWAY,
    label: 'Go to API Gateway',
    sequence: ['U', 'G'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_CONNECTIONS]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_CONNECTIONS,
    label: 'Go to Database Connections',
    sequence: ['U', 'C'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_DATABASE]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_DATABASE,
    label: 'Go to Database',
    sequence: ['U', 'D'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_DATA_API]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_DATA_API,
    label: 'Go to Data API',
    sequence: ['U', 'P'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_AUTH]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_AUTH,
    label: 'Go to Auth',
    sequence: ['U', 'A'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_FUNCTIONS]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_FUNCTIONS,
    label: 'Go to Edge Functions',
    sequence: ['U', 'F'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_STORAGE]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_STORAGE,
    label: 'Go to Storage',
    sequence: ['U', 'S'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
  [OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_REALTIME]: {
    id: OBSERVABILITY_NAV_SHORTCUT_IDS.NAV_OBSERVABILITY_REALTIME,
    label: 'Go to Realtime',
    sequence: ['U', 'L'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_OBSERVABILITY,
  },
}
