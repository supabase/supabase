import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Edge Functions sub-pages — `F + <letter>`.
 *
 * Active only while EdgeFunctionsLayout is mounted (i.e. the user is somewhere
 * under `/project/<ref>/functions/*`). Mirrors the database-nav / auth-nav /
 * storage-nav pattern: the leading `F` is layout-scoped so it doesn't burn a
 * global key.
 */
export const FUNCTIONS_NAV_SHORTCUT_IDS = {
  NAV_FUNCTIONS_OVERVIEW: 'nav.functions-overview',
  NAV_FUNCTIONS_SECRETS: 'nav.functions-secrets',
}

export type FunctionsNavShortcutId =
  (typeof FUNCTIONS_NAV_SHORTCUT_IDS)[keyof typeof FUNCTIONS_NAV_SHORTCUT_IDS]

export const functionsNavRegistry: RegistryDefinations<FunctionsNavShortcutId> = {
  [FUNCTIONS_NAV_SHORTCUT_IDS.NAV_FUNCTIONS_OVERVIEW]: {
    id: FUNCTIONS_NAV_SHORTCUT_IDS.NAV_FUNCTIONS_OVERVIEW,
    label: 'Go to Functions',
    sequence: ['F', 'O'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTIONS,
  },
  [FUNCTIONS_NAV_SHORTCUT_IDS.NAV_FUNCTIONS_SECRETS]: {
    id: FUNCTIONS_NAV_SHORTCUT_IDS.NAV_FUNCTIONS_SECRETS,
    label: 'Go to Secrets',
    sequence: ['F', 'K'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTIONS,
  },
}
