import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the Edge Functions overview (list) page.
 *
 * The shared list-page shortcuts (focus search, create new item, reset
 * filters) are reused directly from `list-page.ts`. Only functions-specific
 * actions live here.
 */
export const FUNCTIONS_LIST_SHORTCUT_IDS = {
  FUNCTIONS_LIST_REFRESH: 'functions-list.refresh',
  FUNCTIONS_LIST_CLEAR_SORT: 'functions-list.clear-sort',
}

export type FunctionsListShortcutId =
  (typeof FUNCTIONS_LIST_SHORTCUT_IDS)[keyof typeof FUNCTIONS_LIST_SHORTCUT_IDS]

export const functionsListRegistry: RegistryDefinations<FunctionsListShortcutId> = {
  [FUNCTIONS_LIST_SHORTCUT_IDS.FUNCTIONS_LIST_REFRESH]: {
    id: FUNCTIONS_LIST_SHORTCUT_IDS.FUNCTIONS_LIST_REFRESH,
    label: 'Refresh functions',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_LIST_SHORTCUT_IDS.FUNCTIONS_LIST_CLEAR_SORT]: {
    id: FUNCTIONS_LIST_SHORTCUT_IDS.FUNCTIONS_LIST_CLEAR_SORT,
    label: 'Clear sort',
    sequence: ['S', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
