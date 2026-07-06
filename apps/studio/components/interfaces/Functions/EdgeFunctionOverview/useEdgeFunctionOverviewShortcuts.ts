import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseEdgeFunctionOverviewShortcutsParams {
  onSetInterval: (key: string) => void
  onRefresh: () => void
  onOpenLogs: () => void
}

/**
 * Shortcuts scoped to the per-function Overview tab (the new flag-gated UI).
 *
 *   - I+M / I+H / I+T / I+D: select chart interval
 *   - Shift+R: refresh the combined stats query
 *   - O+L: jump to the Logs (or Invocations) sub-page
 *
 * Should be mounted once inside `EdgeFunctionOverview`.
 */
export function useEdgeFunctionOverviewShortcuts({
  onSetInterval,
  onRefresh,
  onOpenLogs,
}: UseEdgeFunctionOverviewShortcutsParams) {
  useShortcut(SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_15MIN, () => onSetInterval('15min'))
  useShortcut(SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_1HR, () => onSetInterval('1hr'))
  useShortcut(SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_3HR, () => onSetInterval('3hr'))
  useShortcut(SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_1DAY, () => onSetInterval('1day'))
  useShortcut(SHORTCUT_IDS.FUNCTION_OVERVIEW_REFRESH, onRefresh)
  useShortcut(SHORTCUT_IDS.FUNCTION_OVERVIEW_OPEN_LOGS, onOpenLogs)
}
