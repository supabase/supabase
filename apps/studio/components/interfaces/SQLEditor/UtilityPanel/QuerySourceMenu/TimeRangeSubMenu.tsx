import dayjs from 'dayjs'
import { Check, Lock } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

import {
  datePickerValueToLogDateRange,
  logDateRangesEqual,
  type LogDateRange,
} from '../../querySource'
import { EXPLORER_DATEPICKER_HELPERS } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { maybeShowUpgradePromptIfNotEntitled } from '@/components/interfaces/Settings/Logs/Logs.utils'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'

export const TimeRangeSubMenu = ({
  id,
  range,
  onOpenCustomRange,
  onShowUpgrade,
}: {
  id: string
  range: LogDateRange
  onOpenCustomRange: () => void
  onShowUpgrade: () => void
}) => {
  const sessionSnap = useSqlEditorSessionSnapshot()
  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToLogDays = getEntitlementNumericValue()

  const isCustomRange = range.kind === 'absolute'
  const presets = EXPLORER_DATEPICKER_HELPERS.map((helper) => ({
    helper,
    range: datePickerValueToLogDateRange({
      from: helper.calcFrom(),
      to: helper.calcTo(),
      isHelper: true,
      text: helper.text,
    }),
  }))
  const selectedPreset = presets.find((preset) => logDateRangesEqual(range, preset.range))

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <div className="flex flex-col">
          <span>Time range</span>
          <span className="text-foreground-lighter text-xs">
            {isCustomRange
              ? `${dayjs(range.from).format('DD MMM, HH:mm')} - ${dayjs(range.to).format('DD MMM, HH:mm')}`
              : (selectedPreset?.helper.text ?? 'Custom range')}
          </span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-52">
        {presets.map(({ helper, range: presetRange }) => {
          const isSelected = !isCustomRange && logDateRangesEqual(range, presetRange)
          const isLocked = maybeShowUpgradePromptIfNotEntitled(helper.calcFrom(), entitledToLogDays)

          return (
            <DropdownMenuItem
              key={helper.text}
              className="justify-between"
              onClick={() => {
                if (isLocked) return onShowUpgrade()
                sessionSnap.setLogRange(id, presetRange)
              }}
            >
              <span>{helper.text}</span>
              {isLocked ? (
                <Lock size={14} className="text-foreground-lighter" />
              ) : (
                isSelected && <Check size={14} />
              )}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-between" onClick={onOpenCustomRange}>
          <span>Custom range…</span>
          {isCustomRange && <Check size={14} />}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
