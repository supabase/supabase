'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'

const frameworks = [
  {
    value: 'next.js',
    label: 'Next.js',
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit',
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js',
  },
  {
    value: 'remix',
    label: 'Remix',
  },
  {
    value: 'astro',
    label: 'Astro',
  },
]

export function BranchMenu() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          role="combobox"
          size={'tiny'}
          aria-expanded={open}
          className="w-[200px] justify-between"
          iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : 'Select framework...'}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[500px] p-0 flex h-full" align="start">
        <Command_Shadcn_ className="border-r border-overlay rounded-none">
          <CommandInput_Shadcn_ placeholder="Search framework..." />
          <CommandEmpty_Shadcn_>No framework found.</CommandEmpty_Shadcn_>
          <CommandGroup_Shadcn_>
            {frameworks.map((framework) => (
              <CommandItem_Shadcn_
                key={framework.value}
                value={framework.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? '' : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === framework.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {framework.label}
              </CommandItem_Shadcn_>
            ))}
          </CommandGroup_Shadcn_>
        </Command_Shadcn_>
        <Command_Shadcn_ className="border-r border-overlay rounded-none">
          <CommandInput_Shadcn_ placeholder="Search framework..." />
          <CommandEmpty_Shadcn_>No framework found.</CommandEmpty_Shadcn_>
          <CommandGroup_Shadcn_>
            {frameworks.map((framework) => (
              <CommandItem_Shadcn_
                key={framework.value}
                value={framework.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? '' : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === framework.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {framework.label}
              </CommandItem_Shadcn_>
            ))}
          </CommandGroup_Shadcn_>
        </Command_Shadcn_>
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search framework..." />
          <CommandEmpty_Shadcn_>No framework found.</CommandEmpty_Shadcn_>
          <CommandGroup_Shadcn_>
            {frameworks.map((framework) => (
              <CommandItem_Shadcn_
                key={framework.value}
                value={framework.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? '' : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === framework.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {framework.label}
              </CommandItem_Shadcn_>
            ))}
          </CommandGroup_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
