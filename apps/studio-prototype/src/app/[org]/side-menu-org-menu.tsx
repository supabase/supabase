'use client'

import { orgs } from '@/src/config/org'
import { useConfig } from '@/src/hooks/use-config'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { CommandSeparator_Shadcn_, ScrollArea, ScrollBar, cn } from 'ui'

import {
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

export default function SideMenuOrgMenu() {
  const [open, setOpenState] = useState(false)
  const [config, setConfig] = useConfig()
  const { organization } = config

  return (
    <>
      <Popover_Shadcn_ open={open} onOpenChange={setOpenState}>
        <PopoverTrigger_Shadcn_>
          <div
            className={cn(
              'w-[26px] h-[26px] border bg-foreground rounded-md',
              'flex items-center justify-center text-background text-xs font-semibold'
            )}
          >
            {config?.organization?.slice(0, 2).toUpperCase()}
          </div>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="w-[320px] p-0" side="right" align="start" sideOffset={8}>
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Search organizations..." />
            <CommandEmpty_Shadcn_>No framework found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              <ScrollArea className="max-h-[128px] overflow-y-auto">
                {orgs.map((org) => (
                  <CommandItem_Shadcn_
                    key={org.key}
                    value={org.key}
                    onSelect={(currentValue) => {
                      setConfig({
                        ...config,
                        organization: currentValue,
                        project: orgs.find((o) => o.key === currentValue)?.projects[0].key,
                        env: {
                          name: 'main',
                          type: 'prod',
                        },
                      })
                      setOpenState(false)
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-[26px] h-[26px] border bg-foreground rounded-md',
                          'flex items-center justify-center text-background text-xs font-semibold'
                        )}
                      >
                        {org.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{org.name}</span>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 bg-foreground rounded-full',
                        'flex items-center justify-center',
                        organization === org.key ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      <Check className={cn('h-2 w-2 text-background')} strokeWidth={5} />
                    </div>
                  </CommandItem_Shadcn_>
                ))}
                <ScrollBar />
              </ScrollArea>
            </CommandGroup_Shadcn_>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <Link href={`/${organization}/settings/general`}>
                <CommandItem_Shadcn_ value="Settings">Organization Settings</CommandItem_Shadcn_>
              </Link>
              <CommandItem_Shadcn_ value="Members">Members</CommandItem_Shadcn_>
              <CommandItem_Shadcn_ value="Billing">Billing</CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}
