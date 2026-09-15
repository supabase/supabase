import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Digit shortcuts (1-5) for jumping between the tabs on a function detail
 * page — Overview, Invocations, Logs, Code, Settings.
 *
 * Active only while EdgeFunctionDetailsLayout is mounted (i.e. the user is
 * on a `/project/<ref>/functions/<slug>/*` route). Digits are scoped to this
 * layout so they don't burn global keys.
 */
export const FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS = {
  NAV_FUNCTION_DETAIL_OVERVIEW: 'nav.function-detail-overview',
  NAV_FUNCTION_DETAIL_INVOCATIONS: 'nav.function-detail-invocations',
  NAV_FUNCTION_DETAIL_LOGS: 'nav.function-detail-logs',
  NAV_FUNCTION_DETAIL_CODE: 'nav.function-detail-code',
  NAV_FUNCTION_DETAIL_SETTINGS: 'nav.function-detail-settings',
}

export type FunctionsDetailNavShortcutId =
  (typeof FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS)[keyof typeof FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS]

export const functionsDetailNavRegistry: RegistryDefinations<FunctionsDetailNavShortcutId> = {
  [FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_OVERVIEW]: {
    id: FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_OVERVIEW,
    label: 'Go to Overview',
    sequence: ['1'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTION_DETAIL,
  },
  [FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_INVOCATIONS]: {
    id: FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_INVOCATIONS,
    label: 'Go to Invocations',
    sequence: ['2'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTION_DETAIL,
  },
  [FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_LOGS]: {
    id: FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_LOGS,
    label: 'Go to Logs',
    sequence: ['3'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTION_DETAIL,
  },
  [FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_CODE]: {
    id: FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_CODE,
    label: 'Go to Code',
    sequence: ['4'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTION_DETAIL,
  },
  [FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_SETTINGS]: {
    id: FUNCTIONS_DETAIL_NAV_SHORTCUT_IDS.NAV_FUNCTION_DETAIL_SETTINGS,
    label: 'Go to Settings',
    sequence: ['5'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_FUNCTION_DETAIL,
  },
}
