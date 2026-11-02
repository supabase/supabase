import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Realtime sub-pages — `R + <letter>`.
 *
 * Active only while RealtimeLayout is mounted (i.e. the user is somewhere
 * under `/project/<ref>/realtime/*`). Mirrors the database-nav / auth-nav /
 * functions-nav pattern: the leading `R` is layout-scoped so it doesn't burn a
 * global key.
 */
export const REALTIME_NAV_SHORTCUT_IDS = {
  NAV_REALTIME_INSPECTOR: 'nav.realtime-inspector',
  NAV_REALTIME_POLICIES: 'nav.realtime-policies',
  NAV_REALTIME_SETTINGS: 'nav.realtime-settings',
}

export type RealtimeNavShortcutId =
  (typeof REALTIME_NAV_SHORTCUT_IDS)[keyof typeof REALTIME_NAV_SHORTCUT_IDS]

export const realtimeNavRegistry: RegistryDefinations<RealtimeNavShortcutId> = {
  [REALTIME_NAV_SHORTCUT_IDS.NAV_REALTIME_INSPECTOR]: {
    id: REALTIME_NAV_SHORTCUT_IDS.NAV_REALTIME_INSPECTOR,
    label: 'Go to Inspector',
    sequence: ['R', 'I'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_REALTIME,
  },
  [REALTIME_NAV_SHORTCUT_IDS.NAV_REALTIME_POLICIES]: {
    id: REALTIME_NAV_SHORTCUT_IDS.NAV_REALTIME_POLICIES,
    label: 'Go to Policies',
    sequence: ['R', 'P'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_REALTIME,
  },
  [REALTIME_NAV_SHORTCUT_IDS.NAV_REALTIME_SETTINGS]: {
    id: REALTIME_NAV_SHORTCUT_IDS.NAV_REALTIME_SETTINGS,
    label: 'Go to Settings',
    sequence: ['R', 'S'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_REALTIME,
  },
}
