import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to Observability report pages. Reuses the existing
 * conventions from logs-preview (Shift+R refresh, Shift+P toggle date picker)
 * and list-page (Shift+F focus filter/search, F C reset filters,
 * Shift+N create new). Pages bind these via `useShortcut` and pass `label`
 * overrides where the surface action is more specific than the generic label.
 */
export const OBSERVABILITY_PAGE_SHORTCUT_IDS = {
  OBSERVABILITY_REFRESH: 'observability.refresh',
  OBSERVABILITY_TOGGLE_DATE_PICKER: 'observability.toggle-date-picker',
  OBSERVABILITY_FOCUS_FILTER: 'observability.focus-filter',
  OBSERVABILITY_RESET_FILTERS: 'observability.reset-filters',
  OBSERVABILITY_NEW_REPORT: 'observability.new-report',
  OBSERVABILITY_RESET_REPORT: 'observability.reset-report',
  OBSERVABILITY_FILTER_REQUESTS: 'observability.filter-requests',
}

export type ObservabilityPageShortcutId =
  (typeof OBSERVABILITY_PAGE_SHORTCUT_IDS)[keyof typeof OBSERVABILITY_PAGE_SHORTCUT_IDS]

export const observabilityPageRegistry: RegistryDefinations<ObservabilityPageShortcutId> = {
  [OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_REFRESH]: {
    id: OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_REFRESH,
    label: 'Refresh report',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true, conflictBehavior: 'allow' },
  },
  [OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER]: {
    id: OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER,
    label: 'Open time picker',
    sequence: ['Shift+P'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true, conflictBehavior: 'allow' },
  },
  [OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_FOCUS_FILTER]: {
    id: OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_FOCUS_FILTER,
    label: 'Add filter',
    sequence: ['Shift+F'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_RESET_FILTERS]: {
    id: OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_RESET_FILTERS,
    label: 'Reset filters',
    sequence: ['F', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_NEW_REPORT]: {
    id: OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_NEW_REPORT,
    label: 'New custom report',
    sequence: ['Shift+N'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_RESET_REPORT]: {
    id: OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_RESET_REPORT,
    label: 'Reset report',
    sequence: ['R', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_FILTER_REQUESTS]: {
    id: OBSERVABILITY_PAGE_SHORTCUT_IDS.OBSERVABILITY_FILTER_REQUESTS,
    label: 'Filter requests',
    sequence: ['Shift+S'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
