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

  const mainBranch = branchOptions.find((branch) => branch.project_ref === projectRef)
  const selectedRef = branchOptions.some((branch) => branch.project_ref === branchRef)
    ? branchRef
    : projectRef

  return (
    <Select
      value={selectedRef ?? projectRef}
      onValueChange={(value) => onSelectBranch(value === projectRef ? null : value)}
    >
      <SelectTrigger
        size="tiny"
        className="w-auto min-w-[140px] max-w-[280px]"
        aria-label="Filter by branch"
      >
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={projectRef}>{mainBranch?.name ?? 'Main branch'}</SelectItem>
        {branchOptions
          .filter((branch) => branch.project_ref !== projectRef)
          .map((branch) => (
            <SelectItem key={branch.project_ref} value={branch.project_ref}>
              {branch.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
