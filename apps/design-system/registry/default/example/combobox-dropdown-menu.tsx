'use client'

import { Calendar, MoreHorizontal, Tags, Trash, User } from 'lucide-react'
import * as React from 'react'
import {
  Button,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  ScrollArea,
} from 'ui'

const labels = [
  'feature',
  'bug',
  'enhancement',
  'documentation',
  'design',
  'question',
  'maintenance',
]

export default function ComboboxDropdownMenu() {
  const [label, setLabel] = React.useState('feature')
  const [open, setOpen] = React.useState(false)

  return (
    <div className="bg-surface-100 flex w-full flex-col items-start justify-between rounded-md border px-4 py-3 sm:flex-row sm:items-center">
      <p className="text-sm font-medium leading-none">
        <span className="mr-2 rounded-lg bg-surface-200 border px-2 py-1 text-xs text-foreground">
          {label}
        </span>
        <span className="text-foreground">Create a new project</span>
      </p>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="text"
            size="tiny"
            icon={<MoreHorizontal className="text-foreground-muted" />}
          ></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Assign to...
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Calendar className="mr-2 h-4 w-4" />
              Set due date...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tags className="mr-2 h-4 w-4" />
                Apply label
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-0">
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Filter label..." autoFocus={true} />
                  <ScrollArea className="h-20">
                    <CommandList_Shadcn_>
                      <CommandEmpty_Shadcn_>No label found.</CommandEmpty_Shadcn_>
                      <CommandGroup_Shadcn_>
                        {labels.map((label) => (
                          <CommandItem_Shadcn_
                            key={label}
                            value={label}
                            onSelect={(value) => {
                              setLabel(value)
                              setOpen(false)
                            }}
                          >
                            {label}
                          </CommandItem_Shadcn_>
                        ))}
                      </CommandGroup_Shadcn_>
                    </CommandList_Shadcn_>
                  </ScrollArea>
                </Command_Shadcn_>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
