import { ListTree, Plus } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  ScrollArea,
} from 'ui'

import { BranchLink } from './BranchLink'
import { CommandItemLink } from '@/components/ui/CommandItemLink'
import type { Branch } from '@/data/branches/branches-query'
import { useTrack } from '@/lib/telemetry/track'

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
      <Command className={cn(className, 'flex flex-col flex-1 min-h-0 overflow-hidden')}>
        <div className="grid grid-cols-2 gap-2 shrink-0 p-2 border-b">
          <Button
            variant="text"
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
          <CommandInput placeholder="Find branch..." wrapperClassName="shrink-0 border-b" />
        )}
        <CommandList className="flex flex-col flex-1 p-1 min-h-0 overflow-y-auto max-h-none!">
          {isBranchingEnabled && <CommandEmpty>No branches found</CommandEmpty>}
          <CommandGroup className="min-h-0">
            {branchList.map((branch) => (
              <BranchLink
                key={branch.id}
                branch={branch}
                isSelected={branch.id === selectedBranch?.id || branchesCount === 0}
                onClose={onClose}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    )
  }

  return (
    <Command className={className}>
      {isBranchingEnabled && <CommandInput placeholder="Find branch..." />}
      <CommandList>
        {isBranchingEnabled && <CommandEmpty>No branches found</CommandEmpty>}
        <CommandGroup>
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
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup>
          <CommandItem
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
          </CommandItem>
          <CommandItemLink
            href={`/project/${projectRef}/branches`}
            className="cursor-pointer w-full gap-2"
            onSelect={() => {
              track('branch_selector_manage_clicked')
              onClose()
            }}
          >
            <ListTree size={14} strokeWidth={1.5} />
            <p>Manage branches</p>
          </CommandItemLink>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
