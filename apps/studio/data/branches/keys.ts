export const branchKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'branches'] as const,
  detail: (id: string | undefined) => ['branches', id] as const,
}
