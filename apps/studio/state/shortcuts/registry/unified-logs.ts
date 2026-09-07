import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the Unified Logs page (`components/interfaces/UnifiedLogs`).
 * They are page-scoped: each is only active while the relevant Unified Logs
 * component is mounted.
 *
 * Grid/detail-panel bindings (prev/next, close) mirror the Logs Explorer
 * (`logs-preview`) and Table Editor patterns so the keyboard model stays
 * consistent across our data-grid surfaces. Copying selected logs reuses the
 * shared `results.copy-*` shortcuts (see `RowSelectionHeader`).
 */
export const UNIFIED_LOGS_SHORTCUT_IDS = {
  UNIFIED_LOGS_RESET_FOCUS: 'unified-logs.reset-focus',
  UNIFIED_LOGS_REFRESH: 'unified-logs.refresh',
  UNIFIED_LOGS_DOWNLOAD: 'unified-logs.download',
  UNIFIED_LOGS_FOCUS_FILTER: 'unified-logs.focus-filter',
  UNIFIED_LOGS_CLEAR_FILTERS: 'unified-logs.clear-filters',
  UNIFIED_LOGS_PREV_ROW: 'unified-logs.prev-row',
  UNIFIED_LOGS_NEXT_ROW: 'unified-logs.next-row',
  UNIFIED_LOGS_CLOSE_PANEL: 'unified-logs.close-panel',
}

export type UnifiedLogsShortcutId =
  (typeof UNIFIED_LOGS_SHORTCUT_IDS)[keyof typeof UNIFIED_LOGS_SHORTCUT_IDS]

export const unifiedLogsRegistry: RegistryDefinations<UnifiedLogsShortcutId> = {
  [UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_RESET_FOCUS]: {
    id: UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_RESET_FOCUS,
    label: 'Reset focus in logs',
    sequence: ['Mod+.'],
    showInSettings: false,
  },
  [UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_REFRESH]: {
    id: UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_REFRESH,
    label: 'Refresh logs',
    sequence: ['Shift+R'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.UNIFIED_LOGS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_DOWNLOAD]: {
    id: UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_DOWNLOAD,
    label: 'Download logs',
    sequence: ['Shift+E'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.UNIFIED_LOGS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_FOCUS_FILTER]: {
    id: UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_FOCUS_FILTER,
    label: 'Focus filter bar',
    sequence: ['Shift+F'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.UNIFIED_LOGS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_CLEAR_FILTERS]: {
    id: UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_CLEAR_FILTERS,
    label: 'Clear filters',
    sequence: ['F', 'C'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.UNIFIED_LOGS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_PREV_ROW]: {
    id: UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_PREV_ROW,
    label: 'Previous log',
    sequence: ['ArrowUp'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.UNIFIED_LOGS,
    options: { ignoreInputs: true },
  },
  [UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_NEXT_ROW]: {
    id: UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_NEXT_ROW,
    label: 'Next log',
    sequence: ['ArrowDown'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.UNIFIED_LOGS,
    options: { ignoreInputs: true },
  },
  [UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_CLOSE_PANEL]: {
    id: UNIFIED_LOGS_SHORTCUT_IDS.UNIFIED_LOGS_CLOSE_PANEL,
    label: 'Close log details panel',
    sequence: ['Escape'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.UNIFIED_LOGS,
    options: { ignoreInputs: true, conflictBehavior: 'allow' },
  },
}
