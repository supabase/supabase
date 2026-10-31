export const branchKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'branches'] as const,
  detail: (projectRef: string | undefined, branchRef: string | undefined) =>
    ['projects', projectRef, 'branches', branchRef] as const,
  diff: (projectRef: string | undefined, branchRef: string | undefined, pgdelta?: boolean) =>
    ['projects', projectRef, 'branch', branchRef, 'diff', pgdelta] as const,
}
