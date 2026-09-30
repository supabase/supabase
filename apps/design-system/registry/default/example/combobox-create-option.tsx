'use client'

import { Check, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  Button,
  ComboboxTrigger,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

export default function ComboboxCreateOption() {
  const [buckets, setBuckets] = useState(['Images', 'Exports'])
  const [selectedBucket, setSelectedBucket] = useState('')
  const [newBucketName, setNewBucketName] = useState('')
  const [isListOpen, setIsListOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateBucket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newBucketName.trim()
    if (!name) return

    setBuckets((current) => [...current, name])
    setSelectedBucket(name)
    setNewBucketName('')
    setIsDialogOpen(false)
  }

  return (
    <>
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
                    setIsDialogOpen(true)
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateBucket}>
            <DialogHeader>
              <DialogTitle>Create a bucket</DialogTitle>
            </DialogHeader>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-2">
              <Label htmlFor="new-bucket-name">Bucket name</Label>
              <Input
                id="new-bucket-name"
                value={newBucketName}
                onChange={(event) => setNewBucketName(event.target.value)}
              />
            </DialogSection>
            <DialogFooter>
              <Button type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!newBucketName.trim()}>
                Create bucket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
