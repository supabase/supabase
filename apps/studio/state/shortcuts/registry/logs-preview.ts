import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the LogsPreviewer component — used by Function Logs,
 * Function Invocations, and the Logs Explorer page. They are page-scoped:
 * each shortcut is only active while LogsPreviewer is mounted.
 *
 * Grid-related bindings (start-nav, toggle-all, toggle-row, escape) mirror the
 * Auth Users / Table Editor patterns so the keyboard model stays consistent
 * across our react-data-grid surfaces.
 */
export const LOGS_PREVIEW_SHORTCUT_IDS = {
  LOGS_PREVIEW_REFRESH: 'logs-preview.refresh',
  LOGS_PREVIEW_TOGGLE_CHART: 'logs-preview.toggle-chart',
  LOGS_PREVIEW_LOAD_OLDER: 'logs-preview.load-older',
  LOGS_PREVIEW_TOGGLE_DATE_PICKER: 'logs-preview.toggle-date-picker',
  LOGS_PREVIEW_TOGGLE_ALL_SELECTION: 'logs-preview.toggle-all-selection',
  LOGS_PREVIEW_TOGGLE_ROW_SELECTION: 'logs-preview.toggle-row-selection',
  LOGS_PREVIEW_EXIT_SELECTION: 'logs-preview.exit-selection',
  LOGS_PREVIEW_CLOSE_PANEL: 'logs-preview.close-panel',
  LOGS_PREVIEW_START_NAV_DOWN: 'logs-preview.start-nav-down',
  LOGS_PREVIEW_START_NAV_UP: 'logs-preview.start-nav-up',
}

export type LogsPreviewShortcutId =
  (typeof LOGS_PREVIEW_SHORTCUT_IDS)[keyof typeof LOGS_PREVIEW_SHORTCUT_IDS]

export const logsPreviewRegistry: RegistryDefinations<LogsPreviewShortcutId> = {
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_REFRESH]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_REFRESH,
    label: 'Refresh logs',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_CHART]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_CHART,
    label: 'Toggle histogram',
    sequence: ['Shift+H'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_LOAD_OLDER]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_LOAD_OLDER,
    label: 'Load older logs',
    sequence: ['Shift+L'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_DATE_PICKER]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_DATE_PICKER,
    label: 'Open time range picker',
    sequence: ['Shift+P'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_ALL_SELECTION]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_ALL_SELECTION,
    label: 'Toggle selection on all displayed logs',
    sequence: ['Mod+A'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_ROW_SELECTION]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_ROW_SELECTION,
    label: 'Toggle selection on current row',
    sequence: ['Shift+Space'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_EXIT_SELECTION]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_EXIT_SELECTION,
    label: 'Clear log selection',
    sequence: ['Escape'],
    showInSettings: false,
    options: { ignoreInputs: true, conflictBehavior: 'allow' },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_CLOSE_PANEL]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_CLOSE_PANEL,
    label: 'Close log details panel',
    sequence: ['Escape'],
    showInSettings: false,
    options: { ignoreInputs: true, conflictBehavior: 'allow' },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_START_NAV_DOWN]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_START_NAV_DOWN,
    label: 'Move focus into logs grid',
    sequence: ['ArrowDown'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_START_NAV_UP]: {
    id: LOGS_PREVIEW_SHORTCUT_IDS.LOGS_PREVIEW_START_NAV_UP,
    label: 'Move focus into logs grid',
    sequence: ['ArrowUp'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
}
