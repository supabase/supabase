import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the per-function Overview tab (the new flag-gated UI).
 *
 * The interval picker uses an `I + <letter>` chord matching the first letter
 * of the interval's unit (M=minute, H=hour, T=three-hour, D=day).
 */
export const FUNCTIONS_OVERVIEW_SHORTCUT_IDS = {
  FUNCTION_OVERVIEW_INTERVAL_15MIN: 'functions-overview.interval-15min',
  FUNCTION_OVERVIEW_INTERVAL_1HR: 'functions-overview.interval-1hr',
  FUNCTION_OVERVIEW_INTERVAL_3HR: 'functions-overview.interval-3hr',
  FUNCTION_OVERVIEW_INTERVAL_1DAY: 'functions-overview.interval-1day',
  FUNCTION_OVERVIEW_REFRESH: 'functions-overview.refresh',
  FUNCTION_OVERVIEW_OPEN_LOGS: 'functions-overview.open-logs',
}

export type FunctionsOverviewShortcutId =
  (typeof FUNCTIONS_OVERVIEW_SHORTCUT_IDS)[keyof typeof FUNCTIONS_OVERVIEW_SHORTCUT_IDS]

export const functionsOverviewRegistry: RegistryDefinations<FunctionsOverviewShortcutId> = {
  [FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_15MIN]: {
    id: FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_15MIN,
    label: 'Show last 15 minutes',
    sequence: ['I', 'M'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_1HR]: {
    id: FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_1HR,
    label: 'Show last hour',
    sequence: ['I', 'H'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_3HR]: {
    id: FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_3HR,
    label: 'Show last 3 hours',
    sequence: ['I', 'T'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_1DAY]: {
    id: FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_1DAY,
    label: 'Show last day',
    sequence: ['I', 'D'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_REFRESH]: {
    id: FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_REFRESH,
    label: 'Refresh function stats',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_OPEN_LOGS]: {
    id: FUNCTIONS_OVERVIEW_SHORTCUT_IDS.FUNCTION_OVERVIEW_OPEN_LOGS,
    label: 'Open logs',
    sequence: ['O', 'L'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
