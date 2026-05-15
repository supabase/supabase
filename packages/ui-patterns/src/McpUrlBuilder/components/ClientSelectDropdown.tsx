'use client'

import { Bot, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import type { McpClient } from '../types'
import { ConnectionIcon } from './ConnectionIcon'

export interface ClientGroup {
  heading: string
  clients: McpClient[]
}

interface ClientSelectDropdownProps {
  theme?: 'light' | 'dark'
  label?: string
  clients: McpClient[]
  groups?: ClientGroup[]
  selectedClient: McpClient
  onClientChange: (clientKey: string) => void
}

export const ClientSelectDropdown = ({
  theme = 'light',
  label = 'Client',
  clients,
  groups,
  selectedClient,
  onClientChange,
}: ClientSelectDropdownProps) => {
  const [open, setOpen] = useState(false)

  function onSelectClient(key: string) {
    onClientChange(key)
    setOpen(false)
  }

  function renderClient(client: McpClient) {
    return (
      <CommandItem_Shadcn_
        key={client.key}
        value={client.key}
        onSelect={() => onSelectClient(client.key)}
        className="flex gap-2 items-center"
      >
        {client.icon ? (
          <ConnectionIcon
            connection={client.icon}
            theme={theme}
            hasDistinctDarkIcon={client.hasDistinctDarkIcon}
          />
        ) : (
          <Bot size={12} aria-hidden={true} />
        )}
        {client.label}
        <Check
          aria-label={client.key === selectedClient.key ? 'selected' : undefined}
          size={15}
          className={cn('ml-auto', client.key === selectedClient.key ? 'opacity-100' : 'opacity-0')}
        />
      </CommandItem_Shadcn_>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <div className="flex">
        <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
          {label}
        </span>
        <PopoverTrigger asChild>
          <Button
            size="small"
            type="default"
            className="gap-0 rounded-l-none"
            iconRight={
              <ChevronDown
                strokeWidth={1.5}
                className={cn('transition-transform duration-200', open && 'rotate-180')}
              />
            }
          >
            <div className="flex items-center gap-2">
              {selectedClient?.icon ? (
                <ConnectionIcon
                  connection={selectedClient.icon}
                  theme={theme}
                  hasDistinctDarkIcon={selectedClient.hasDistinctDarkIcon}
                />
              ) : (
                <Bot size={12} aria-hidden={true} />
              )}
              {selectedClient?.label}
            </div>
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="mt-0 p-0 max-w-48" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
            {groups ? (
              groups.map((group) => (
                <CommandGroup_Shadcn_ key={group.heading} heading={group.heading}>
                  {group.clients.map(renderClient)}
                </CommandGroup_Shadcn_>
              ))
            ) : (
              <CommandGroup_Shadcn_>{clients.map(renderClient)}</CommandGroup_Shadcn_>
            )}
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent>
    </Popover>
  )
}
