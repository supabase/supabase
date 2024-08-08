import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus } from 'lucide-react'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  Command_Shadcn_,
  IconPlus,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'
import { WRAPPERS } from './Wrappers.constants'

interface WrapperDropdownProps {
  buttonText?: string
  align?: 'center' | 'end'
}

const WrapperDropdown = ({ buttonText = 'Add wrapper', align = 'end' }: WrapperDropdownProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const canManageWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')
  const [open, setOpen] = useState(false)

  if (!canManageWrappers) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>
          <Button disabled type="primary" icon={<IconPlus strokeWidth={1.5} />}>
            {buttonText}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-alternative py-1 px-2 leading-none shadow',
                'border border-background',
              ].join(' ')}
            >
              <span className="text-xs text-foreground">
                You need additional permissions to add wrappers
              </span>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="primary"
          role="combobox"
          aria-expanded={open}
          icon={<Plus className="h-4 w-4 shrink-0" />}
        >
          {buttonText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[200px] p-0" align={align}>
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search wrappers..." />
          <CommandEmpty_Shadcn_ className="py-3">No wrappers found</CommandEmpty_Shadcn_>
          <CommandGroup_Shadcn_>
            <ScrollArea className="max-h-[270px] overflow-scroll">
              {WRAPPERS.map((wrapper) => (
                <CommandItem_Shadcn_
                  key={wrapper.name}
                  value={wrapper.name}
                  onSelect={() => {
                    setOpen(false)
                    router.push(
                      `/project/${ref}/database/wrappers/new?type=${wrapper.name.toLowerCase()}`
                    )
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <Image
                    width={20}
                    height={20}
                    src={wrapper.icon}
                    alt={`${wrapper.name} wrapper icon`}
                  />
                  {wrapper.label}
                </CommandItem_Shadcn_>
              ))}
            </ScrollArea>
          </CommandGroup_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default WrapperDropdown
