import type { Branch } from 'data/branches/branches-query'
import { useTrack } from 'lib/telemetry/track'
import { ListTree, MessageCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  ScrollArea,
} from 'ui'

import { BranchLink } from './BranchLink'

const BRANCHING_GITHUB_DISCUSSION_LINK = 'https://github.com/orgs/supabase/discussions/18937'

export interface BranchDropdownCommandContentProps {
  embedded: boolean
  className?: string
  branchList: Branch[]
  selectedBranch: Branch | undefined
  branchesCount: number
  isBranchingEnabled: boolean
  projectRef: string | undefined
  onClose: () => void
  onCreateBranch: () => void
}

export function BranchDropdownCommandContent({
  embedded,
  className,
  branchList,
  selectedBranch,
  branchesCount,
  isBranchingEnabled,
  projectRef,
  onClose,
  onCreateBranch,
}: BranchDropdownCommandContentProps) {
  const track = useTrack()

  if (embedded) {
    return (
      <Command_Shadcn_ className={cn(className, 'flex flex-col flex-1 min-h-0 overflow-hidden')}>
        <div className="grid grid-cols-2 gap-2 shrink-0 p-2 border-b">
          <Button
            type="text"
            size="small"
            asChild
            block
            icon={<ListTree size={14} strokeWidth={1.5} />}
          >
            <Link
              href={`/project/${projectRef}/branches`}
              className="text-xs text-foreground-light hover:text-foreground"
              onClick={onClose}
            >
              Manage branches
            </Link>
          </Button>
          <Button
            type="text"
            size="small"
            asChild
            block
            icon={<MessageCircle size={14} strokeWidth={1.5} />}
          >
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={BRANCHING_GITHUB_DISCUSSION_LINK}
              onClick={onClose}
              className="text-xs text-foreground-light hover:text-foreground"
            >
              Branching feedback
            </a>
          </Button>
          <Button
            type="default"
            size="small"
            block
            className="col-span-full text-xs text-foreground-light hover:text-foreground"
            onClick={() => {
              track('branch_selector_create_clicked')
              onClose()
              onCreateBranch()
            }}
            icon={<Plus size={14} strokeWidth={1.5} />}
          >
            Create branch
          </Button>
        </div>
        {isBranchingEnabled && (
          <CommandInput_Shadcn_ placeholder="Find branch..." wrapperClassName="shrink-0 border-b" />
        )}
        <CommandList_Shadcn_ className="flex flex-col flex-1 p-1 min-h-0 overflow-y-auto !max-h-none">
          {isBranchingEnabled && <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>}
          <CommandGroup_Shadcn_ className="min-h-0">
            {branchList.map((branch) => (
              <BranchLink
                key={branch.id}
                branch={branch}
                isSelected={branch.id === selectedBranch?.id || branchesCount === 0}
                onClose={onClose}
              />
            ))}
          </CommandGroup_Shadcn_>
        </CommandList_Shadcn_>
      </Command_Shadcn_>
    )
  }

  return (
    <Command_Shadcn_ className={className}>
      {isBranchingEnabled && <CommandInput_Shadcn_ placeholder="Find branch..." />}
      <CommandList_Shadcn_>
        {isBranchingEnabled && <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>}
        <CommandGroup_Shadcn_>
          <ScrollArea className="max-h-[210px] overflow-y-auto">
            {branchList.map((branch) => (
              <BranchLink
                key={branch.id}
                branch={branch}
                isSelected={branch.id === selectedBranch?.id || branchesCount === 0}
                onClose={onClose}
              />
            ))}
          </ScrollArea>
        </CommandGroup_Shadcn_>

        <CommandSeparator_Shadcn_ />

        <CommandGroup_Shadcn_>
          <CommandItem_Shadcn_
            className="cursor-pointer w-full"
            onSelect={() => {
              track('branch_selector_create_clicked')
              onClose()
              onCreateBranch()
            }}
          >
            <div className="w-full flex items-center gap-2">
              <Plus size={14} strokeWidth={1.5} />
              <p>Create branch</p>
            </div>
          </CommandItem_Shadcn_>
          <CommandItem_Shadcn_
            className="cursor-pointer w-full"
            onSelect={() => {
              track('branch_selector_manage_clicked')
              onClose()
            }}
          >
            <Link
              href={`/project/${projectRef}/branches`}
              className="w-full flex items-center gap-2"
            >
              <ListTree size={14} strokeWidth={1.5} />
              <p>Manage branches</p>
            </Link>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>

        <CommandSeparator_Shadcn_ />

        <CommandGroup_Shadcn_>
          <CommandItem_Shadcn_
            className="cursor-pointer w-full"
            onSelect={() => {
              onClose()
              window?.open(BRANCHING_GITHUB_DISCUSSION_LINK, '_blank')?.focus()
            }}
            onClick={onClose}
          >
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={BRANCHING_GITHUB_DISCUSSION_LINK}
              onClick={onClose}
              className="w-full flex gap-2"
            >
              <MessageCircle size={14} strokeWidth={1} className="mt-0.5" />
              <div>
                <p>Branching feedback</p>
                <p className="text-lighter">Join GitHub Discussion</p>
              </div>
            </a>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  )
}
