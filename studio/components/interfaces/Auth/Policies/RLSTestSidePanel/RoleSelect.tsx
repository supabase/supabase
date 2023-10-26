import { useState } from 'react'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconCode,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { Role } from './RLSTestSidePanel.types'

interface RoleSelectProps {
  role: Role
  onSelectRole: (role: Role) => void
}

const RoleSelect = ({ role, onSelectRole }: RoleSelectProps) => {
  const [open, setOpen] = useState(false)

  const onSelectOption = (role: Role) => {
    onSelectRole(role)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-sm">Type of user</p>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="outline"
            className={`w-full [&>span]:w-full`}
            iconRight={
              <IconCode className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
            }
          >
            <div className="w-full flex space-x-3 py-0.5">
              <p className="text-sm capitalize">{role}</p>
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandList_Shadcn_>
              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  value="anonymous"
                  className="text-sm cursor-pointer"
                  onSelect={() => onSelectOption('anonymous')}
                  onClick={() => onSelectOption('anonymous')}
                >
                  Anonymous
                </CommandItem_Shadcn_>
                <CommandItem_Shadcn_
                  value="authenticated"
                  className="text-sm cursor-pointer"
                  onSelect={() => onSelectOption('authenticated')}
                  onClick={() => onSelectOption('authenticated')}
                >
                  Authenticated
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

export default RoleSelect
