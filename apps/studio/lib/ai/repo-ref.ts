type GitBranch = { git_branch?: string | null; is_default?: boolean }

export function resolveRepoRef({
  currentBranch,
  branches,
}: {
  currentBranch?: GitBranch
  branches?: GitBranch[]
}) {
  return currentBranch?.git_branch || branches?.find((branch) => branch.is_default)?.git_branch
}
