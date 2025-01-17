import { Box, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'
import { ConnectionIcon } from './ConnectionIcon'

interface ConnectDropdownProps {
  state: string
  updateState: (state: string) => void
  label: string
  items: any[]
}

const ConnectDropdown = ({
  state,
  updateState,
  label,

  items,
}: ConnectDropdownProps) => {
  const [open, setOpen] = useState(false)

  function onSelectLib(key: string) {
    updateState(key)
    setOpen(false)
  }

  const selectedItem = items.find((item) => item.key === state)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <div className="flex ">
        <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
          {label}
        </span>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            size="small"
            type="default"
            className="gap-0 rounded-l-none"
            iconRight={<ChevronDown strokeWidth={1.5} />}
          >
            <div className="flex items-center gap-2">
              {selectedItem?.icon ? (
                <ConnectionIcon connection={selectedItem.icon} />
              ) : (
                <Box size={12} />
              )}
              {selectedItem?.label}
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
      </div>
      <PopoverContent_Shadcn_ className="p-0 max-w-48" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {items.map((item) => (
                <CommandItem_Shadcn_
                  key={item.key}
                  value={item.key}
                  onSelect={() => {
                    onSelectLib(item.key)
                    setOpen(false)
                  }}
                  className="flex gap-2 items-center"
                >
                  {item.icon ? <ConnectionIcon connection={item.icon} /> : <Box size={12} />}
                  {item.label}
                  <Check
                    size={15}
                    className={cn('ml-auto  ', item.key === state ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default ConnectDropdown
