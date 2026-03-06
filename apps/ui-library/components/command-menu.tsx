'use client'

import { CircleIcon, LaptopIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import {
  Button,
  CommandDialog,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  DialogProps,
} from 'ui'

import { COMMAND_ITEMS } from '@/config/docs'
import { cn } from '@/lib/utils'

export function CommandMenu({ ...props }: DialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        type="outline"
        className={cn(
          `relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-foreground-muted shadow-none sm:pr-12
            hover:border-foreground-muted hover:bg-surface-100 hover:text-foreground-lighter
          `
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">Search UI Library...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-surface-200 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-foreground-light">
          <span className="text-sm">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput_Shadcn_ placeholder="Type a command or search..." />
        <CommandList_Shadcn_>
          <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
          <CommandGroup_Shadcn_ key="pages" heading="Pages">
            {COMMAND_ITEMS.map((navItem) => (
              <CommandItem_Shadcn_
                key={navItem.href}
                value={navItem.label}
                onSelect={() => runCommand(() => router.push(navItem.href as string))}
              >
                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                  <CircleIcon className="h-3 w-3" strokeWidth={1} />
                </div>
                {navItem.label}
              </CommandItem_Shadcn_>
            ))}
          </CommandGroup_Shadcn_>
          <CommandSeparator_Shadcn_ />
          <CommandGroup_Shadcn_ heading="Theme">
            <CommandItem_Shadcn_ onSelect={() => runCommand(() => setTheme('light'))}>
              <SunIcon className="mr-2 h-4 w-4" strokeWidth={1} />
              Light
            </CommandItem_Shadcn_>
            <CommandItem_Shadcn_ onSelect={() => runCommand(() => setTheme('dark'))}>
              <MoonIcon className="mr-2 h-4 w-4" strokeWidth={1} />
              Dark
            </CommandItem_Shadcn_>
            <CommandItem_Shadcn_ onSelect={() => runCommand(() => setTheme('classic-dark'))}>
              <MoonIcon className="mr-2 h-4 w-4" strokeWidth={1} />
              Classic dark
            </CommandItem_Shadcn_>
            <CommandItem_Shadcn_ onSelect={() => runCommand(() => setTheme('system'))}>
              <LaptopIcon className="mr-2 h-4 w-4" strokeWidth={1} />
              System
            </CommandItem_Shadcn_>
          </CommandGroup_Shadcn_>
        </CommandList_Shadcn_>
      </CommandDialog>
    </>
  )
}
