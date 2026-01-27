'use client'

import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react'
import * as React from 'react'
import {
  CommandDialog,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  CommandShortcut_Shadcn_,
} from 'ui'

export default function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Press{' '}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>J
        </kbd>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput_Shadcn_ placeholder="Type a command or search..." />
        <CommandList_Shadcn_>
          <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
          <CommandGroup_Shadcn_ heading="Suggestions">
            <CommandItem_Shadcn_>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendar</span>
            </CommandItem_Shadcn_>
            <CommandItem_Shadcn_>
              <Smile className="mr-2 h-4 w-4" />
              <span>Search Emoji</span>
            </CommandItem_Shadcn_>
            <CommandItem_Shadcn_>
              <Calculator className="mr-2 h-4 w-4" />
              <span>Calculator</span>
            </CommandItem_Shadcn_>
          </CommandGroup_Shadcn_>
          <CommandSeparator_Shadcn_ />
          <CommandGroup_Shadcn_ heading="Settings">
            <CommandItem_Shadcn_>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut_Shadcn_>⌘P</CommandShortcut_Shadcn_>
            </CommandItem_Shadcn_>
            <CommandItem_Shadcn_>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
              <CommandShortcut_Shadcn_>⌘B</CommandShortcut_Shadcn_>
            </CommandItem_Shadcn_>
            <CommandItem_Shadcn_>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut_Shadcn_>⌘S</CommandShortcut_Shadcn_>
            </CommandItem_Shadcn_>
          </CommandGroup_Shadcn_>
        </CommandList_Shadcn_>
      </CommandDialog>
    </>
  )
}
