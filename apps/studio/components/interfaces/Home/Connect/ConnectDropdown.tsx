import { Box, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'
import ConnectionIcon from './ConnectionIcon'

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
    <>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <div className="flex ">
          <span className="flex items-center text-foreground-muted px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
            {label}
          </span>
          <PopoverTrigger_Shadcn_ asChild>
            <Button size="small" type="default" className="gap-0 rounded-l-none">
              <div className="flex items-center gap-2">
                {selectedItem?.icon ? (
                  <ConnectionIcon connection={selectedItem.icon} />
                ) : (
                  <Box size={12} />
                )}
                {selectedItem?.label}
                <ChevronDown className="text-muted" strokeWidth={1} size={12} />
              </div>
            </Button>
          </PopoverTrigger_Shadcn_>
        </div>
        <PopoverContent_Shadcn_ className="p-0 max-w-48" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Search..." className="h-9" />
            <CommandList_Shadcn_>
              {items.map((item) => (
                <CommandItem_Shadcn_
                  key={item.key}
                  value={item.key}
                  onSelect={() => {
                    onSelectLib(item.key)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 py-0.5 w-full">
                    {item.icon ? <ConnectionIcon connection={item.icon} /> : <Box size={12} />}

                    {item.label}

                    <Check
                      size={15}
                      className={cn('ml-auto  ', item.key === state ? 'opacity-100' : 'opacity-0')}
                    />
                  </div>
                </CommandItem_Shadcn_>
              ))}
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}

export default ConnectDropdown
