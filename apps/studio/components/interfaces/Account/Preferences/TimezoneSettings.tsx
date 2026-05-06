import { useFlag } from 'common'
import { CheckIcon, ChevronsUpDown, Globe } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { findTimezoneByIana, TIMEZONES_BY_IANA } from '@/lib/constants/timezones'
import { useTimezone } from '@/lib/datetime'
import { guessLocalTimezone } from '@/lib/dayjs'
import { useTrack } from '@/lib/telemetry/track'

const AUTO_OPTION_VALUE = '__auto__'

export const TimezoneSettings = () => {
  const timezonePickerEnabled = useFlag('timezonePicker')
  const { timezone, storedTimezone, setTimezone, isAutoDetected } = useTimezone()
  const track = useTrack()
  const [open, setOpen] = useState(false)
  const listboxId = useId()

  // Browser timezone is captured once and stays stable even when the user has
  // overridden the dashboard timezone — that's the value the "Auto detect"
  // option will revert to.
  const browserTimezone = useMemo(() => guessLocalTimezone(), [])

  const triggerLabel = useMemo(() => findTimezoneByIana(timezone)?.text ?? timezone, [timezone])

  if (!timezonePickerEnabled) return null

  const handleSelect = (nextStored: string) => {
    setTimezone(nextStored)
    const resolvedNext = nextStored || guessLocalTimezone()
    track('timezone_picker_clicked', {
      previousTimezone: timezone,
      nextTimezone: resolvedNext,
      isAutoDetected: nextStored === '',
      source: 'account_preferences',
    })
    setOpen(false)
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Timezone</PageSectionTitle>
          <PageSectionDescription>
            Choose how dates and times in logs and other dashboard surfaces are displayed.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              label="Display timezone"
              layout="flex-row-reverse"
              description={
                isAutoDetected
                  ? `Auto detected from your browser (${browserTimezone}).`
                  : 'Pick "Auto detect" to follow your browser timezone again.'
              }
            >
              <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listboxId}
                    className="w-full justify-between"
                    type="default"
                    size="small"
                    icon={<Globe />}
                    iconRight={<ChevronsUpDown size={14} strokeWidth={1.5} />}
                  >
                    <span className="truncate text-left">
                      {isAutoDetected ? `Auto detect (${timezone})` : triggerLabel}
                    </span>
                  </Button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_
                  id={listboxId}
                  className="w-[--radix-popover-trigger-width] p-0"
                >
                  <Command_Shadcn_>
                    <CommandInput_Shadcn_ placeholder="Search timezone..." className="h-9" />
                    <CommandList_Shadcn_>
                      <CommandEmpty_Shadcn_>No timezones found</CommandEmpty_Shadcn_>
                      <CommandGroup_Shadcn_>
                        <ScrollArea className="h-72">
                          <CommandItem_Shadcn_
                            key={AUTO_OPTION_VALUE}
                            value={`Auto detect ${browserTimezone}`}
                            onSelect={() => handleSelect('')}
                          >
                            <div className="flex flex-col">
                              <span>Auto detect</span>
                              <span className="text-xs text-foreground-lighter">
                                {browserTimezone}
                              </span>
                            </div>
                            <CheckIcon
                              className={cn(
                                'ml-auto h-4 w-4',
                                isAutoDetected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </CommandItem_Shadcn_>
                          {TIMEZONES_BY_IANA.map((entry) => {
                            const ianaName = entry.utc[0]
                            const isSelected = !isAutoDetected && storedTimezone === ianaName
                            return (
                              <CommandItem_Shadcn_
                                key={ianaName}
                                // CommandItem matches against the `value` prop for the input filter — include
                                // both the human label and the IANA name so search works for either.
                                value={`${entry.text} ${ianaName}`}
                                onSelect={() => handleSelect(ianaName)}
                              >
                                {entry.text}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    isSelected ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                              </CommandItem_Shadcn_>
                            )
                          })}
                        </ScrollArea>
                      </CommandGroup_Shadcn_>
                    </CommandList_Shadcn_>
                  </Command_Shadcn_>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            </FormItemLayout>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
