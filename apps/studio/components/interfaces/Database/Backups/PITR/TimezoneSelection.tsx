import { CheckIcon, Globe } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
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

import { formatTimezoneLabel, getTimezoneOptions } from '@/lib/constants/timezones'

interface TimezoneSelectionProps {
  selectedTimezone: string
  onSelectTimezone: (timezone: string) => void
  referenceTimeUnix?: number
}

export const TimezoneSelection = ({
  selectedTimezone,
  onSelectTimezone,
  referenceTimeUnix,
}: TimezoneSelectionProps) => {
  const [open, setOpen] = useState(false)
  const listboxId = useId()

  const options = useMemo(() => {
    const referenceDate =
      referenceTimeUnix === undefined ? new Date() : new Date(referenceTimeUnix * 1000)
    const timezoneOptions = getTimezoneOptions(referenceDate)
    if (timezoneOptions.some((option) => option.iana === selectedTimezone)) {
      return timezoneOptions
    }
    return [
      {
        iana: selectedTimezone,
        label: formatTimezoneLabel(selectedTimezone, referenceDate),
      },
      ...timezoneOptions,
    ]
  }, [selectedTimezone, referenceTimeUnix])

  const selectedLabel = useMemo(() => {
    const referenceDate =
      referenceTimeUnix === undefined ? new Date() : new Date(referenceTimeUnix * 1000)
    return formatTimezoneLabel(selectedTimezone, referenceDate)
  }, [selectedTimezone, referenceTimeUnix])

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
              <span className="truncate">{selectedLabel}</span>
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
                  {options.map(({ iana, label }) => (
                    <CommandItem
                      key={iana}
                      value={`${label} ${iana}`}
                      onSelect={() => {
                        onSelectTimezone(iana)
                        setOpen(false)
                      }}
                    >
                      {label}
                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4',
                          selectedTimezone === iana ? 'opacity-100' : 'opacity-0'
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
