import { CheckIcon, ChevronsUpDown, Globe } from 'lucide-react'
import { useId, useState } from 'react'
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

import { ALL_TIMEZONES } from './PITR.constants'
import type { Timezone } from './PITR.types'

interface TimezoneSelectionProps {
  selectedTimezone: Timezone
  onSelectTimezone: (timezone: Timezone) => void
}

export const TimezoneSelection = ({
  selectedTimezone,
  onSelectTimezone,
}: TimezoneSelectionProps) => {
  const [open, setOpen] = useState(false)
  const listboxId = useId()

  const timezoneOptions = ALL_TIMEZONES.map((option) => option.text)

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
            {selectedTimezone
              ? timezoneOptions.find((option) => option === selectedTimezone.text)
              : 'Select timezone...'}
          </Button>
        </PopoverTrigger>
        <PopoverContent id={listboxId} className="w-[350px] p-0">
          <Command>
            <CommandInput placeholder="Search timezone..." className="h-9" />
            <CommandList>
              <CommandEmpty>No timezones found...</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-72">
                  {timezoneOptions.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={(text) => {
                        const selectedTimezone = ALL_TIMEZONES.find(
                          (option) => option.text === text
                        )
                        if (selectedTimezone) {
                          onSelectTimezone(selectedTimezone)
                          setOpen(false)
                        }
                      }}
                    >
                      {option}
                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4',
                          selectedTimezone.text === option ? 'opacity-100' : 'opacity-0'
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
