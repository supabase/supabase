import { CheckIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  ScrollArea,
} from 'ui'

import { findTimezoneByIana, TIMEZONES_BY_IANA } from '@/lib/constants/timezones'
import { useTimezone } from '@/lib/datetime'
import { guessLocalTimezone } from '@/lib/dayjs'
import { useTrack } from '@/lib/telemetry/track'

const AUTO_OPTION_VALUE = '__auto__'

export const TimezoneDropdown = () => {
  const { timezone, storedTimezone, setTimezone, isAutoDetected } = useTimezone()
  const track = useTrack()
  const [open, setOpen] = useState(false)

  // The "Auto detect" row always advertises the browser's own timezone, even
  // when the user is currently overriding it with a manual pick.
  const browserTimezone = useMemo(() => guessLocalTimezone(), [])

  const triggerLabel = useMemo(() => {
    return findTimezoneByIana(timezone)?.text ?? timezone
  }, [timezone])

  const handleSelect = (nextStored: string) => {
    setTimezone(nextStored)
    const resolvedNext = nextStored || guessLocalTimezone()
    track('timezone_picker_clicked', {
      previousTimezone: timezone,
      nextTimezone: resolvedNext,
      isAutoDetected: nextStored === '',
      source: 'user_dropdown',
    })
    setOpen(false)
  }

  return (
    <DropdownMenuSub open={open} onOpenChange={setOpen}>
      <DropdownMenuSubTrigger className="flex gap-2 cursor-pointer">
        <div className="flex flex-col min-w-0">
          <span>Timezone</span>
          <span className="text-xs text-foreground-lighter truncate" title={triggerLabel}>
            {isAutoDetected ? `Auto (${timezone})` : triggerLabel}
          </span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="p-0 w-[320px]" sideOffset={4}>
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
                      <span className="text-xs text-foreground-lighter">{browserTimezone}</span>
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
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}
