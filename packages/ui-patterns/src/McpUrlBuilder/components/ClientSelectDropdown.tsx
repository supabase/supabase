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
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

import type { McpClient } from '../types'
import { ConnectionIcon } from './ConnectionIcon'

interface ClientSelectDropdownProps {
  basePath: string
  theme?: 'light' | 'dark'
  label?: string
  clients: McpClient[]
  selectedClient: McpClient
  onClientChange: (clientKey: string) => void
}

export const ClientSelectDropdown = ({
  basePath,
  theme = 'light',
  label = 'Client',
  clients,
  selectedClient,
  onClientChange,
}: ClientSelectDropdownProps) => {
  const [open, setOpen] = useState(false)

  function onSelectClient(key: string) {
    onClientChange(key)
    setOpen(false)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <div className="flex">
        <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
          {label}
        </span>
        <PopoverTrigger_Shadcn_ asChild>
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
                  basePath={basePath}
                  iconFolder="mcp-clients"
                  connection={selectedClient.icon}
                  theme={theme}
                  supportsDarkMode={true}
                />
              ) : (
                <Bot size={12} aria-hidden={true} />
              )}
              {selectedClient?.label}
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
      </div>
      <PopoverContent_Shadcn_ className="mt-0 p-0 max-w-48" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {clients.map((client) => (
                <CommandItem_Shadcn_
                  key={client.key}
                  value={client.key}
                  onSelect={() => {
                    onSelectClient(client.key)
                    setOpen(false)
                  }}
                  className="flex gap-2 items-center"
                >
                  {client.icon ? (
                    <ConnectionIcon
                      basePath={basePath}
                      iconFolder="mcp-clients"
                      connection={client.icon}
                      theme={theme}
                      supportsDarkMode={true}
                    />
                  ) : (
                    <Bot size={12} aria-hidden={true} />
                  )}
                  {client.label}
                  <Check
                    aria-label={client.key === selectedClient.key ? 'selected' : undefined}
                    size={15}
                    className={cn(
                      'ml-auto',
                      client.key === selectedClient.key ? 'opacity-100' : 'opacity-0'
                    )}
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
