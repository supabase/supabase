'use client'

import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  ComboboxTrigger,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

const buckets = ['Images', 'Exports']

export default function ComboboxCreateOption() {
  const [selectedBucket, setSelectedBucket] = useState('')
  const [isListOpen, setIsListOpen] = useState(false)

  return (
    <Popover open={isListOpen} onOpenChange={setIsListOpen}>
      <PopoverTrigger asChild>
        <ComboboxTrigger
          aria-expanded={isListOpen}
          data-state={isListOpen ? 'open' : 'closed'}
          className="w-[240px]"
        >
          {selectedBucket || 'Select a bucket'}
        </ComboboxTrigger>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {buckets.map((bucket) => (
                <CommandItem
                  key={bucket}
                  value={bucket}
                  className="cursor-pointer justify-between"
                  onSelect={() => {
                    setSelectedBucket(bucket)
                    setIsListOpen(false)
                  }}
                >
                  {bucket}
                  {selectedBucket === bucket && <Check size={14} />}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                className="cursor-pointer"
                onSelect={() => {
                  setIsListOpen(false)
                  // Open the creation flow here without changing the selected bucket.
                }}
              >
                <Plus size={14} className="mr-2" />
                New bucket
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
