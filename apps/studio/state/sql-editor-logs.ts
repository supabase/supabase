import { proxy, useSnapshot } from 'valtio'

import { getDefaultLogsTimeRange } from '@/components/interfaces/SQLEditor/sqlEditorLogs'

// Time range used when the SQL Editor runs against the logs source. Module-level
// so the picker (UtilityActions) and execution (SQLEditor) share one source of
// truth without threading props. Defaults to the last 24 hours.
const initialRange = getDefaultLogsTimeRange(new Date())

export const sqlEditorLogsState = proxy({
  iso_timestamp_start: initialRange.iso_timestamp_start,
  iso_timestamp_end: initialRange.iso_timestamp_end,
  setTimeRange: (start: string, end: string) => {
    sqlEditorLogsState.iso_timestamp_start = start
    sqlEditorLogsState.iso_timestamp_end = end
  },
})

export const useSqlEditorLogsStateSnapshot = () => useSnapshot(sqlEditorLogsState)
