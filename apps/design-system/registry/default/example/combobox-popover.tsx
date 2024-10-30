'use client'

import * as React from 'react'
import {
  ArrowUpCircle,
  CheckCircle2,
  Circle,
  HelpCircle,
  LucideIcon,
  Plus,
  XCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button, CommandList_Shadcn_ } from 'ui'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
} from 'ui'
import { Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

type Status = {
  value: string
  label: string
  icon: LucideIcon
}

const statuses: Status[] = [
  {
    value: 'backlog',
    label: 'Backlog',
    icon: HelpCircle,
  },
  {
    value: 'todo',
    label: 'Todo',
    icon: Circle,
  },
  {
    value: 'in progress',
    label: 'In Progress',
    icon: ArrowUpCircle,
  },
  {
    value: 'done',
    label: 'Done',
    icon: CheckCircle2,
  },
  {
    value: 'canceled',
    label: 'Canceled',
    icon: XCircle,
  },
]

export default function ComboboxPopover() {
  const [open, setOpen] = React.useState(false)
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(null)

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-muted-foreground">Status</p>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="default"
            size="small"
            className="w-[150px] justify-start rounded-full"
            icon={
              selectedStatus ? (
                <selectedStatus.icon className="mr-2 h-4 w-4 shrink-0" />
              ) : (
                <Plus className="mr-2 h-4 w-4 shrink-0 text-foreground-muted" />
              )
            }
          >
            {selectedStatus ? <>{selectedStatus.label}</> : <>Set status</>}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="right" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Change status..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {statuses.map((status) => (
                  <CommandItem_Shadcn_
                    key={status.value}
                    value={status.value}
                    onSelect={(value) => {
                      setSelectedStatus(
                        statuses.find((priority) => priority.value === value) || null
                      )
                      setOpen(false)
                    }}
                  >
                    <status.icon
                      className={cn(
                        'mr-2 h-4 w-4',
                        status.value === selectedStatus?.value ? 'opacity-100' : 'opacity-40'
                      )}
                    />
                    <span>{status.label}</span>
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}
