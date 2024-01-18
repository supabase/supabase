import { Box, ChevronDown } from 'lucide-react'
import ConnectionIcon from './ConnectionIcon'
import {
  Button,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

interface ConnectDropdownProps {
  level?: 'parent' | 'child' | 'grandchild'
  open: boolean
  setOpen: (open: boolean) => void
  state: string
  updateState: (state: string) => void
  label: string
  items: any[]
}

const ConnectDropdown = ({
  level,
  state,
  updateState,
  label,
  open,
  setOpen,
  items,
}: ConnectDropdownProps) => {
  function onSelectLib(key: string) {
    updateState(key)
    setOpen(false)
  }

  const selectedItem = items.find((item) => item.key === state)

  return (
    <>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <div className="flex items-center">
          <span className="flex items-center text-foreground-muted bg-button px-3 rounded-md rounded-r-none text-xs h-[26px] border border-r-0">
            {label}
          </span>
          <PopoverTrigger_Shadcn_ asChild>
            <Button size="tiny" type="default" className="h-[26px] pr-3 gap-0 rounded-l-none">
              <div className="flex items-center gap-1">
                <span className="text-xs text-foreground-light flex items-center gap-2  pl-1">
                  {selectedItem?.icon ? (
                    <ConnectionIcon connection={selectedItem.icon} />
                  ) : (
                    <Box size={12} />
                  )}
                  {selectedItem?.label}
                </span>
                <ChevronDown className="text-muted" strokeWidth={1} size={12} />
              </div>
            </Button>
          </PopoverTrigger_Shadcn_>
        </div>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandList_Shadcn_>
              {items.map((item) => (
                <CommandItem_Shadcn_
                  key={item.key}
                  value={item.key}
                  onSelect={() => {
                    onSelectLib(item.key)
                    setOpen(false)
                  }}
                  onClick={() => {
                    onSelectLib(item.key)
                    setOpen(false)
                  }}
                >
                  <span className="flex items-center gap-1">
                    {item.icon ? <ConnectionIcon connection={item.icon} /> : <Box size={12} />}

                    {/* <ConnectionIcon connection={item.key} /> */}
                    {item.label}
                  </span>
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
