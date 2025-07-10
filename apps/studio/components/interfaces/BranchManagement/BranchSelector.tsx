import { Check, ChevronsUpDown, GitMerge, Shield } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Branch } from 'data/branches/branches-query'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'

interface BranchSelectorProps {
  branches: Branch[]
  projectRef: string
  onBranchSelected?: (branch: Branch) => void
  disabled?: boolean
}

export const BranchSelector = ({
  branches,
  projectRef,
  onBranchSelected,
  disabled = false,
}: BranchSelectorProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)

  const { mutate: updateBranch, isLoading: isUpdating } = useBranchUpdateMutation({
    onSuccess: (_, variables) => {
      toast.success('Branch marked as ready for review')
      setOpen(false)
      if (variables.requestReview && selectedBranch) {
        // Redirect to merge page for the selected branch
        router.push(`/project/${selectedBranch.project_ref}/merge`)
        onBranchSelected?.(selectedBranch)
      }
      setSelectedBranch(null)
    },
    onError: (error) => {
      toast.error(`Failed to mark branch for review: ${error.message}`)
      setSelectedBranch(null)
    },
  })

  // Filter out branches that are already ready for review and the main branch
  const availableBranches = branches.filter(
    (branch) => !branch.is_default && !branch.review_requested_at
  )

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch)
    if (branch.id && projectRef) {
      updateBranch({
        id: branch.id,
        projectRef,
        requestReview: true,
      })
    }
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="primary"
          size="tiny"
          disabled={disabled || availableBranches.length === 0 || isUpdating}
          icon={<GitMerge size={14} strokeWidth={1.5} />}
          iconRight={<ChevronsUpDown strokeWidth={1.5} size={14} />}
          className="gap-2"
        >
          {isUpdating ? 'Creating...' : 'Create new review'}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-80" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Find branch to review..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No available branches found</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_ heading="Select branch for review">
              <ScrollArea className="max-h-[210px] overflow-y-auto">
                {availableBranches.map((branch) => (
                  <CommandItem_Shadcn_
                    key={branch.id}
                    value={branch.name.replaceAll('"', '')}
                    className="cursor-pointer w-full flex items-center justify-between"
                    onSelect={() => handleBranchSelect(branch)}
                    disabled={isUpdating}
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
