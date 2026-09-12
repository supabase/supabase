import dayjs from 'dayjs'
import { Check, Lock } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

import { datePickerValueToLogTimeRange, logTimeRangesEqual } from './LogTimeRange.utils'
import { EXPLORER_DATEPICKER_HELPERS } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { maybeShowUpgradePromptIfNotEntitled } from '@/components/interfaces/Settings/Logs/Logs.utils'
import type { TimeRange } from '@/data/content/notebooks/notebook-schema'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

export const LogsTimeRangeSubMenu = ({
  range,
  onRangeChange,
  onOpenCustomRange,
  onShowUpgrade,
}: {
  range: TimeRange
  onRangeChange: (range: TimeRange) => void
  onOpenCustomRange: () => void
  onShowUpgrade: () => void
}) => {
  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToLogDays = getEntitlementNumericValue()

  const isCustomRange = range._tag === 'absolute_time_range'
  const presets = EXPLORER_DATEPICKER_HELPERS.map((helper) => ({
    helper,
    range: datePickerValueToLogTimeRange({
      from: helper.calcFrom(),
      to: helper.calcTo(),
      isHelper: true,
      text: helper.text,
    }),
  }))
  const selectedPreset = presets.find((preset) => logTimeRangesEqual(range, preset.range))

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <div className="flex flex-col">
          <span>Time range</span>
          <span className="text-foreground-lighter text-xs">
            {isCustomRange
              ? `${dayjs(range.start).format('DD MMM, HH:mm')} - ${dayjs(range.end).format('DD MMM, HH:mm')}`
              : (selectedPreset?.helper.text ?? 'Custom range')}
          </span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-52">
        {presets.map(({ helper, range: presetRange }) => {
          const isSelected = !isCustomRange && logTimeRangesEqual(range, presetRange)
          const isLocked = maybeShowUpgradePromptIfNotEntitled(helper.calcFrom(), entitledToLogDays)

          return (
            <DropdownMenuItem
              key={helper.text}
              className="justify-between"
              onClick={() => {
                if (isLocked) return onShowUpgrade()
                onRangeChange(presetRange)
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
