import { useState } from 'react'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent,
  PopoverTrigger,
  Popover,
  cn,
} from 'ui'
import { Box, Check, ChevronDown } from 'lucide-react'
import { ConnectionType } from 'components/interfaces/Connect/Connect.constants'
import { ConnectionIcon } from 'components/interfaces/Connect/ConnectionIcon'

interface FrameworkSelectorProps {
  value: string
  onChange: (value: string) => void
  items: ConnectionType[]
  className?: string
}

export const FrameworkSelector = ({
  value,
  onChange,
  items,
  className,
}: FrameworkSelectorProps) => {
  const [open, setOpen] = useState(false)

  const selectedItem = items.find((item) => item.key === value)

  function handleSelect(key: string) {
    onChange(key)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <div className={cn('flex', className)}>
        <PopoverTrigger asChild>
          <Button
            size="tiny"
            type="default"
            className="gap-0"
            iconRight={<ChevronDown strokeWidth={1.5} />}
          >
            <div className="flex items-center gap-2">
              {selectedItem?.icon ? <ConnectionIcon icon={selectedItem.icon} /> : <Box size={12} />}
              {selectedItem?.label}
            </div>
          </Button>
        </PopoverTrigger>
      </div>
      {/* Render in a portal to avoid layout/stacking shifts; prevent auto-focus to stop scroll jump */}
      <PopoverContent
        className="p-0 max-w-48"
        side="bottom"
        align="start"
        portal
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {items.map((item) => (
                <CommandItem_Shadcn_
                  key={item.key}
                  value={item.key}
                  onSelect={() => handleSelect(item.key)}
                  className="flex gap-2 items-center"
                >
                  {item.icon ? <ConnectionIcon icon={item.icon} /> : <Box size={12} />}
                  {item.label}
                  <Check
                    size={15}
                    className={cn('ml-auto', item.key === value ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent>
    </Popover>
  )
}
