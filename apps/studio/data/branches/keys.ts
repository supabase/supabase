export const branchKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'branches'] as const,
  detail: (projectRef: string | undefined, branchRef: string | undefined) =>
    ['projects', projectRef, 'branches', branchRef] as const,
  diff: (projectRef: string | undefined, branchRef: string | undefined) =>
    ['projects', projectRef, 'branch', branchRef, 'diff'] as const,
}
