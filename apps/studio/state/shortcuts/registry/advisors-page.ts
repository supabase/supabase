import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the Issues pages.
 */
export const ADVISORS_PAGE_SHORTCUT_IDS = {
  ADVISORS_REFRESH: 'advisors-page.refresh',
}

export type AdvisorsPageShortcutId =
  (typeof ADVISORS_PAGE_SHORTCUT_IDS)[keyof typeof ADVISORS_PAGE_SHORTCUT_IDS]

export const advisorsPageRegistry: RegistryDefinations<AdvisorsPageShortcutId> = {
  [ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_REFRESH]: {
    id: ADVISORS_PAGE_SHORTCUT_IDS.ADVISORS_REFRESH,
    label: 'Rerun checks',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
