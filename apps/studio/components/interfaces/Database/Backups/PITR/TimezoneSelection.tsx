import { useState } from 'react'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  Command_Shadcn_,
  IconGlobe,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'

import { CheckIcon, ChevronsUpDown } from 'lucide-react'
import { ALL_TIMEZONES } from './PITR.constants'
import { Timezone } from './PITR.types'

interface TimezoneSelectionProps {
  selectedTimezone: Timezone
  onSelectTimezone: (timezone: Timezone) => void
}

export const TimezoneSelection = ({
  selectedTimezone,
  onSelectTimezone,
}: TimezoneSelectionProps) => {
  const [open, setOpen] = useState(false)

  const timezoneOptions = ALL_TIMEZONES.map((option) => option.text)

  return (
    <div className="w-full">
      <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            role="combobox"
            aria-expanded={open}
            className="w-[350px] justify-between"
            size="small"
            icon={<IconGlobe />}
            iconRight={<ChevronsUpDown size={14} strokeWidth={1.5} />}
          >
            {selectedTimezone
              ? timezoneOptions.find((option) => option === selectedTimezone.text)
              : 'Select timezone...'}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="w-[350px] p-0">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Search timezone..." className="h-9" />
            <CommandEmpty_Shadcn_> No timezones found</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              <ScrollArea className="h-72">
                {timezoneOptions.map((option) => (
                  <CommandItem_Shadcn_
                    key={option}
                    value={option}
                    onSelect={(text) => {
                      const selectedTimezone = ALL_TIMEZONES.find(
                        (option) => option.text.toLocaleLowerCase() === text
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
                  </CommandItem_Shadcn_>
                ))}
              </ScrollArea>
            </CommandGroup_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}
