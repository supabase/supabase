import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import type { Branch } from '@/data/branches/branches-query'

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
  if (branchOptions.length === 0) return null

  return (
    <Select
      value={branchRef ?? projectRef}
      onValueChange={(value) => onSelectBranch(value === projectRef ? null : value)}
    >
      <SelectTrigger size="tiny" className="w-[180px]" aria-label="Filter by branch">
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent>
        {branchOptions.map((branch) => (
          <SelectItem key={branch.project_ref} value={branch.project_ref}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
