export const branchKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'branches'] as const,
}
