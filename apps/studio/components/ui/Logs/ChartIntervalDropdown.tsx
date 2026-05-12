import { ChevronDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { CHART_INTERVALS } from './logs.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

function getDaysRequired(startValue: number, startUnit: string): number {
  if (startUnit === 'day') return startValue
  if (startUnit === 'hour') return startValue / 24
  return 0
}

interface ChartIntervalDropdownProps {
  value: string
  onChange: (value: string) => void
  organizationSlug?: string
  dropdownAlign?: 'start' | 'center' | 'end'
  tooltipSide?: 'left' | 'right' | 'top' | 'bottom'
}

export const ChartIntervalDropdown = ({
  value,
  onChange,
  organizationSlug,
  dropdownAlign = 'start',
  tooltipSide = 'right',
}: ChartIntervalDropdownProps) => {
  const selectedInterval = CHART_INTERVALS.find((i) => i.key === value) || CHART_INTERVALS[1]

  const { getEntitlementMax } = useCheckEntitlements('log.retention_days')
  const retentionDays = getEntitlementMax()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="default" iconRight={<ChevronDown size={14} />}>
          <span>{selectedInterval.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align={dropdownAlign} className="w-40">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {CHART_INTERVALS.map((i) => {
            const daysRequired = getDaysRequired(i.startValue, i.startUnit)
            const disabled = retentionDays !== undefined && daysRequired > retentionDays

            if (disabled) {
              return (
                <Tooltip key={i.key}>
                  <TooltipTrigger asChild>
                    <DropdownMenuRadioItem disabled value={i.key} className="pointer-events-auto!">
                      {i.label}
                    </DropdownMenuRadioItem>
                  </TooltipTrigger>
                  <TooltipContent side={tooltipSide}>
                    <p>
                      Your plan only includes up to {retentionDays} day
                      {retentionDays !== undefined && retentionDays > 1 ? 's' : ''} of log retention
                    </p>
                    <p className="text-foreground-light">
                      {organizationSlug ? (
                        <>
                          <InlineLink
                            className="text-foreground-light hover:text-foreground"
                            href={`/org/${organizationSlug}/billing?panel=subscriptionPlan`}
                          >
                            Upgrade your plan
                          </InlineLink>{' '}
                          to increase log retention and view statistics for the{' '}
                          {i.label.toLowerCase()}
                        </>
                      ) : (
                        `Upgrade your plan to increase log retention and view statistics for the ${i.label.toLowerCase()}`
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            } else {
              return (
                <DropdownMenuRadioItem key={i.key} value={i.key}>
                  {i.label}
                </DropdownMenuRadioItem>
              )
            }
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
