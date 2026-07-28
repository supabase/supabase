import {
  datePickerValueToLogDateRange,
  logDateRangeToDatePickerValue,
  type LogDateRange,
} from '../querySource'
import { EXPLORER_DATEPICKER_HELPERS } from '@/components/interfaces/Settings/Logs/Logs.constants'
import {
  LogsDatePicker,
  type DatePickerValue,
} from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import { maybeShowUpgradePromptIfNotEntitled } from '@/components/interfaces/Settings/Logs/Logs.utils'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useUpgradePrompt } from '@/hooks/misc/useUpgradePrompt'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'

/**
 * The logs toolbar's time-range control. Wraps the shared `LogsDatePicker` with
 * the same relative/absolute helpers as the Logs Explorer and stores the chosen
 * range in session state (never snippet content), so it stays editable on a
 * read-only shared snippet and resets on reload — the range is a run-time
 * parameter, not part of the saved query.
 *
 * Picks that reach beyond the org's log retention surface the same upgrade
 * prompt the Logs Explorer uses instead of silently querying an unavailable
 * window.
 */
export const LogsRangePicker = ({ id, range }: { id: string; range: LogDateRange }) => {
  const sessionSnap = useSqlEditorSessionSnapshot()

  const value = logDateRangeToDatePickerValue(range)

  const { showUpgradePrompt, setShowUpgradePrompt } = useUpgradePrompt(value.from)
  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToLogDays = getEntitlementNumericValue()

  const handleSubmit = (next: DatePickerValue) => {
    if (maybeShowUpgradePromptIfNotEntitled(next.from, entitledToLogDays)) {
      setShowUpgradePrompt(true)
      return
    }
    sessionSnap.setLogRange(id, datePickerValueToLogDateRange(next))
  }

  return (
    <>
      <LogsDatePicker value={value} helpers={EXPLORER_DATEPICKER_HELPERS} onSubmit={handleSubmit} />
      <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
    </>
  )
}
