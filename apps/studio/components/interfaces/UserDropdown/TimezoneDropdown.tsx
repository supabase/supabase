import { CheckIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  ScrollArea,
} from 'ui'

import { formatTimezoneLabel, getTimezoneOptions } from '@/lib/constants/timezones'
import { useTimezone } from '@/lib/datetime'
import { guessLocalTimezone } from '@/lib/dayjs'
import { useTrack } from '@/lib/telemetry/track'

const AUTO_OPTION_VALUE = '__auto__'

export const TimezoneDropdown = () => {
  const track = useTrack()
  const { timezone, storedTimezone, setTimezone, isAutoDetected } = useTimezone()

  const [open, setOpen] = useState(false)

  // The "Auto detect" row always advertises the browser's own timezone, even
  // when the user is currently overriding it with a manual pick.
  const browserTimezone = useMemo(() => guessLocalTimezone(), [])

  const triggerLabel = useMemo(() => {
    return formatTimezoneLabel(timezone)
  }, [timezone])

  const options = useMemo(() => getTimezoneOptions(), [])

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
          <Command>
            <CommandInput placeholder="Search timezone..." className="h-9" />
            <CommandList>
              <CommandEmpty>No timezones found</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-72">
                  <CommandItem
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
                  </CommandItem>
                  {options.map(({ iana: ianaName, label }) => {
                    const isSelected = !isAutoDetected && storedTimezone === ianaName
                    return (
                      <CommandItem
                        key={ianaName}
                        value={`${label} ${ianaName}`}
                        onSelect={() => handleSelect(ianaName)}
                      >
                        {label}
                        <CheckIcon
                          className={cn(
                            'ml-auto h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}
