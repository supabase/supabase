import type { Dayjs } from 'dayjs'
import { CheckIcon, Globe } from 'lucide-react'
import { useId, useState } from 'react'
import {
  cn,
  ComboboxTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'

import { ALL_TIMEZONES } from './PITR.constants'
import type { Timezone } from './PITR.types'
import { getTimezoneLabel } from './PITR.utils'

interface TimezoneSelectionProps {
  selectedTimezone: Timezone
  date: Dayjs
  onSelectTimezone: (timezone: Timezone) => void
}

export const TimezoneSelection = ({
  selectedTimezone,
  date,
  onSelectTimezone,
}: TimezoneSelectionProps) => {
  const [open, setOpen] = useState(false)
  const listboxId = useId()

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <ComboboxTrigger
            aria-expanded={open}
            aria-controls={listboxId}
            data-state={open ? 'open' : 'closed'}
            className="w-[350px]"
            size="small"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Globe aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="truncate">{getTimezoneLabel(selectedTimezone, date)}</span>
            </span>
          </ComboboxTrigger>
        </PopoverTrigger>
        <PopoverContent id={listboxId} className="w-[350px] p-0">
          <Command>
            <CommandInput placeholder="Search timezone..." className="h-9" />
            <CommandList>
              <CommandEmpty>No timezones found...</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-72">
                  {ALL_TIMEZONES.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={getTimezoneLabel(option, date)}
                      onSelect={() => {
                        onSelectTimezone(option)
                        setOpen(false)
                      }}
                    >
                      {getTimezoneLabel(option, date)}
                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4',
                          selectedTimezone.value === option.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
