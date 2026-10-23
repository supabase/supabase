import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Advisors sub-pages — `V + <letter>`.
 *
 * Active only while IssuesLayout is mounted (i.e. the user is somewhere
 * under `/project/<ref>/advisors/*`). Mirrors the database-nav / auth-nav
 * pattern: the leading `V` (adVisor) is layout-scoped so it doesn't burn a
 * global key. `A` is already in use by Auth.
 */
export const ADVISORS_NAV_SHORTCUT_IDS = {
  NAV_ADVISORS_HEALTH: 'nav.advisors-health',
  NAV_ADVISORS_SECURITY: 'nav.advisors-security',
  NAV_ADVISORS_PERFORMANCE: 'nav.advisors-performance',
  NAV_ADVISORS_RULES: 'nav.advisors-rules',
}

export type AdvisorsNavShortcutId =
  (typeof ADVISORS_NAV_SHORTCUT_IDS)[keyof typeof ADVISORS_NAV_SHORTCUT_IDS]

export const advisorsNavRegistry: RegistryDefinations<AdvisorsNavShortcutId> = {
  [ADVISORS_NAV_SHORTCUT_IDS.NAV_ADVISORS_HEALTH]: {
    id: ADVISORS_NAV_SHORTCUT_IDS.NAV_ADVISORS_HEALTH,
    label: 'Go to health issues',
    sequence: ['V', 'H'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ADVISORS,
  },
  [ADVISORS_NAV_SHORTCUT_IDS.NAV_ADVISORS_SECURITY]: {
    id: ADVISORS_NAV_SHORTCUT_IDS.NAV_ADVISORS_SECURITY,
    label: 'Go to security issues',
    sequence: ['V', 'S'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ADVISORS,
  },
  [ADVISORS_NAV_SHORTCUT_IDS.NAV_ADVISORS_PERFORMANCE]: {
    id: ADVISORS_NAV_SHORTCUT_IDS.NAV_ADVISORS_PERFORMANCE,
    label: 'Go to performance issues',
    sequence: ['V', 'P'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ADVISORS,
  },
  [ADVISORS_NAV_SHORTCUT_IDS.NAV_ADVISORS_RULES]: {
    id: ADVISORS_NAV_SHORTCUT_IDS.NAV_ADVISORS_RULES,
    label: 'Go to check settings',
    sequence: ['V', 'R'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ADVISORS,
  },
}
