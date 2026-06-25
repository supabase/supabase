export const jitDbAccessKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'jit-db-access'] as const,
  status: (projectRef: string | undefined) =>
    ['projects', projectRef, 'jit-db-access-status'] as const,
  members: (projectRef: string | undefined) =>
    ['projects', projectRef, 'jit-db-access-members'] as const,
  self: (projectRef: string | undefined) => ['projects', projectRef, 'jit-db-access-self'] as const,
  orgMembers: (slug: string | undefined) =>
    ['organizations', slug, 'jit-db-access-members'] as const,
}
