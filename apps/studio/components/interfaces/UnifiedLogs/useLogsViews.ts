import { useFlag } from 'common'

import type { UseLogsViewsResult } from './UnifiedLogs.views'
import { useLogsViewsMock } from './useLogsViews.mock'

export const LOGS_SAVED_VIEWS_FLAG = 'logsSavedViews'

const noop = () => {}

const DISABLED_RESULT: UseLogsViewsResult = {
  views: [],
  isLoading: false,
  isError: false,
  error: null,
  createView: () => '',
  updateView: noop,
  deleteView: noop,
}

// Gated here (rather than only at the call site) so the hook is safe to import
// before any UI wires it up. Swap useLogsViewsMock() for a real data/content-backed
// hook in PR2 — this is the only line that should need to change.
export const useLogsViews = (): UseLogsViewsResult => {
  const enabled = useFlag(LOGS_SAVED_VIEWS_FLAG)
  const mock = useLogsViewsMock()
  return enabled ? mock : DISABLED_RESULT
}
