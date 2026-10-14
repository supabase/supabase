import { Check, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import type { Branch } from '@/data/branches/branches-query'
import { onSearchInputEscape } from '@/lib/keyboard'

export interface UsageBranchFilterProps {
  branchOptions: Branch[]
  projectRef: string
  branchRef: string | null
  onSelectBranch: (branchRef: string | null) => void
}

export const UsageBranchFilter = ({
  branchOptions,
  projectRef,
  branchRef,
  onSelectBranch,
}: UsageBranchFilterProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const listboxId = useId()

  if (branchOptions.length === 0) return null

  const mainBranch = branchOptions.find((branch) => branch.project_ref === projectRef)
  const selectedRef = branchOptions.some((branch) => branch.project_ref === branchRef)
    ? branchRef
    : projectRef
  const options = [
    { project_ref: projectRef, name: mainBranch?.name ?? 'Main branch' },
    ...branchOptions.filter((branch) => branch.project_ref !== projectRef),
  ]
  const selectedBranch = options.find((branch) => branch.project_ref === selectedRef)

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          size="tiny"
          className="justify-between w-[180px]"
          aria-label="Filter by branch"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          iconRight={<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        >
          <span className="truncate">{selectedBranch?.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        side="bottom"
        align="start"
        onEscapeKeyDown={(event) => {
          if (search.length > 0) event.preventDefault()
        }}
      >
        <Command>
          <CommandInput
            showResetIcon
            value={search}
            onValueChange={setSearch}
            placeholder="Find branch..."
            handleReset={() => setSearch('')}
            onKeyDown={onSearchInputEscape(search, setSearch)}
            className="text-base sm:text-sm"
          />
          <CommandList id={listboxId} className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>No branches found</CommandEmpty>
            <CommandGroup>
              {options.map((branch) => (
                <CommandItem
                  key={branch.project_ref}
                  value={branch.project_ref}
                  keywords={[branch.name]}
                  className="cursor-pointer w-full"
                  onSelect={() => {
                    onSelectBranch(branch.project_ref === projectRef ? null : branch.project_ref)
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div className="w-full flex items-center justify-between gap-x-2">
                    <span className="truncate">{branch.name}</span>
                    {branch.project_ref === selectedRef && <Check size={16} className="shrink-0" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
