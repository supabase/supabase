import type { Branch } from 'data/branches/branches-query'
import { Check, ListTree, Plus, Shield } from 'lucide-react'
import { useState } from 'react'
import {
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export function BranchSelectionList({
  branches,
  selectedBranch,
  isBranchingEnabled,
  isBranchesLoaded,
  onSelect,
  onCreateBranch,
  onManageBranches,
}: {
  branches: Branch[]
  selectedBranch?: Branch
  isBranchingEnabled: boolean
  isBranchesLoaded: boolean
  onSelect: (branch: Branch) => void
  onCreateBranch: () => void
  onManageBranches: () => void
}) {
  const [search, setSearch] = useState('')
  const lowerSearch = search.toLowerCase()

  const filteredBranches = branches.filter((b) => b.name.toLowerCase().includes(lowerSearch))

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <Command_Shadcn_ shouldFilter={false} className="min-h-0 flex-1 rounded-none border-0">
        <CommandInput_Shadcn_
          value={search}
          onValueChange={setSearch}
          placeholder="Find branch..."
          showResetIcon
          handleReset={() => setSearch('')}
        />
        <CommandList_Shadcn_ className="max-h-none flex-1 overflow-y-auto">
          {!isBranchesLoaded ? (
            <div className="space-y-1 p-2">
              <ShimmeringLoader className="py-2" />
              <ShimmeringLoader className="py-2 w-4/5" />
            </div>
          ) : (
            <>
              <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {filteredBranches.map((branch) => {
                  const isSelected =
                    branch.id === selectedBranch?.id || (!selectedBranch && branch.is_default)
                  return (
                    <CommandItem_Shadcn_
                      key={branch.id}
                      value={branch.name.replaceAll('"', '')}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer',
                        isSelected && 'bg-surface-200'
                      )}
                      onSelect={() => onSelect(branch)}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {branch.is_default && (
                          <Shield size={12} className="text-amber-900 shrink-0" />
                        )}
                        {branch.name}
                      </span>
                      {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                    </CommandItem_Shadcn_>
                  )
                })}
              </CommandGroup_Shadcn_>
            </>
          )}
        </CommandList_Shadcn_>
      </Command_Shadcn_>
      <div className="border-t px-2 py-1.5 space-y-0.5">
        <button
          type="button"
          onClick={onCreateBranch}
          className="flex items-center gap-2 text-xs text-foreground-light hover:text-foreground transition-colors px-1 py-1 w-full"
        >
          <Plus size={12} strokeWidth={1.5} />
          Create branch
        </button>
        {isBranchingEnabled && (
          <button
            type="button"
            onClick={onManageBranches}
            className="flex items-center gap-2 text-xs text-foreground-light hover:text-foreground transition-colors px-1 py-1 w-full"
          >
            <ListTree size={12} strokeWidth={1.5} />
            Manage branches
          </button>
        )}
      </div>
    </div>
  )
}
