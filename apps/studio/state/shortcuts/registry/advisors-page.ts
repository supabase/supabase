import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the Security and Performance Advisor pages — tab digit
 * shortcuts, refresh, and detail panel close. The tab digits mirror the
 * functions-detail-nav pattern (`ignoreInputs: true` so they don't fire from
 * inputs), and `Escape` follows the auth-users close-panel pattern with
 * `conflictBehavior: 'allow'` since other surfaces also use Escape.
 */
export const ADVISORS_PAGE_SHORTCUT_IDS = {
  ADVISORS_TAB_ERRORS: 'advisors-page.tab-errors',
  ADVISORS_TAB_WARNINGS: 'advisors-page.tab-warnings',
  ADVISORS_TAB_INFO: 'advisors-page.tab-info',
  ADVISORS_REFRESH: 'advisors-page.refresh',
  ADVISORS_CLOSE_DETAIL: 'advisors-page.close-detail',
}

export type AdvisorsPageShortcutId =
  (typeof ADVISORS_PAGE_SHORTCUT_IDS)[keyof typeof ADVISORS_PAGE_SHORTCUT_IDS]

export const advisorsPageRegistry: RegistryDefinations<AdvisorsPageShortcutId> = {
  [ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_TAB_ERRORS]: {
    id: ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_TAB_ERRORS,
    label: 'Switch to Errors',
    sequence: ['1'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ADVISORS,
  },
  [ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_TAB_WARNINGS]: {
    id: ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_TAB_WARNINGS,
    label: 'Switch to Warnings',
    sequence: ['2'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ADVISORS,
  },
  [ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_TAB_INFO]: {
    id: ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_TAB_INFO,
    label: 'Switch to Info',
    sequence: ['3'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ADVISORS,
  },
  [ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_REFRESH]: {
    id: ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_REFRESH,
    label: 'Refresh advisor',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_CLOSE_DETAIL]: {
    id: ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_CLOSE_DETAIL,
    label: 'Close lint details panel',
    sequence: ['Escape'],
    showInSettings: false,
    options: { ignoreInputs: true, conflictBehavior: 'allow' },
  },
}
