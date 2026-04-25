import { Check, GitMerge, Shield } from 'lucide-react'
import { useState } from 'react'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { Branch } from '@/data/branches/branches-query'

interface BranchSelectorProps {
  branches: Branch[]
  onBranchSelected?: (branch: Branch) => void
  disabled?: boolean
  isUpdating?: boolean
  type?: 'primary' | 'outline'
  align?: 'end' | 'center'
}

export const BranchSelector = ({
  branches,
  onBranchSelected,
  disabled = false,
  isUpdating = false,
  type = 'primary',
  align = 'end',
}: BranchSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)

  const availableBranches = branches.filter((branch) => !branch.is_default)

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch)
    setOpen(false)
    onBranchSelected?.(branch)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <ButtonTooltip
          icon={<GitMerge size={14} strokeWidth={1.5} />}
          type={type}
          disabled={
            disabled || isUpdating || branches.length === 0 || availableBranches.length === 0
          }
          tooltip={{
            content: {
              side: 'bottom',
              align,
              text:
                branches.length === 0 || availableBranches.length === 0
                  ? 'Create a branch first to start a merge request'
                  : undefined,
            },
          }}
        >
          {isUpdating ? 'Creating...' : 'New merge request'}
        </ButtonTooltip>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-80" side="bottom" align="end">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Find branch to review..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No available branches found</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              <ScrollArea className="max-h-[210px] overflow-y-auto">
                {availableBranches.map((branch) => (
                  <CommandItem_Shadcn_
                    key={branch.id}
                    value={branch.name.replaceAll('"', '')}
                    className="cursor-pointer w-full flex items-center justify-between"
                    onSelect={() => handleBranchSelect(branch)}
                    disabled={isUpdating || !!branch.git_branch || !!branch.review_requested_at}
                  >
                    <div className="flex items-center gap-2">
                      {branch.is_default && <Shield size={14} className="text-amber-900" />}
                      <span className="truncate" title={branch.name}>
                        {branch.name}
                      </span>
                    </div>
                    {selectedBranch?.id === branch.id && (
                      <Check size={14} strokeWidth={1.5} className="text-brand" />
                    )}
                    {branch.git_branch && <span>Synced to a Git branch</span>}
                    {branch.review_requested_at && <span>Merge request opened</span>}
                  </CommandItem_Shadcn_>
                ))}
              </ScrollArea>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
