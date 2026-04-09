import { CheckIcon, ChevronsUpDown, Globe } from 'lucide-react'
import { useId, useState } from 'react'
import {
  Button,
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
      <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            className="w-[350px] justify-between"
            size="small"
            icon={<Globe />}
            iconRight={<ChevronsUpDown size={14} strokeWidth={1.5} />}
          >
            {selectedTimezone
              ? timezoneOptions.find((option) => option === selectedTimezone.text)
              : 'Select timezone...'}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ id={listboxId} className="w-[350px] p-0">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Search timezone..." className="h-9" />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No timezones found...</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                <ScrollArea className="h-72">
                  {timezoneOptions.map((option) => (
                    <CommandItem_Shadcn_
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
                    </CommandItem_Shadcn_>
                  ))}
                </ScrollArea>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}
