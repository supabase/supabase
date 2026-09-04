import { CheckIcon, ChevronsUpDown, Globe } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import {
  Button,
  cn,
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

import { formatTimezoneLabel, TIMEZONES_BY_IANA } from '@/lib/constants/timezones'

interface TimezoneSelectionProps {
  selectedTimezone: string
  onSelectTimezone: (timezone: string) => void
}

export const TimezoneSelection = ({
  selectedTimezone,
  onSelectTimezone,
}: TimezoneSelectionProps) => {
  const [open, setOpen] = useState(false)
  const listboxId = useId()

  const options = useMemo(() => {
    const catalogNames = TIMEZONES_BY_IANA.map((entry) => entry.utc[0])
    // The selected zone is often an alias of a catalog entry rather than its
    // primary name, so it needs adding explicitly to stay selectable
    const ianaNames = catalogNames.includes(selectedTimezone)
      ? catalogNames
      : [selectedTimezone, ...catalogNames]
    return ianaNames.map((iana) => ({ iana, label: formatTimezoneLabel(iana) }))
  }, [selectedTimezone])

  const selectedLabel = formatTimezoneLabel(selectedTimezone)

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            className="w-[350px] justify-start"
            size="small"
            variant="default"
            icon={<Globe />}
            iconRight={<ChevronsUpDown size={14} strokeWidth={1.5} className="ml-auto" />}
          >
            {selectedLabel}
          </Button>
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
                      // CommandItem filters on `value`, so include the IANA name to make it searchable
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
