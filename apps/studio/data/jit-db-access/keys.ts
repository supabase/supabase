export const jitDbAccessKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'jit-db-access'] as const,
  status: (projectRef: string | undefined) =>
    ['projects', projectRef, 'jit-db-access-status'] as const,
  members: (projectRef: string | undefined) =>
    ['projects', projectRef, 'jit-db-access-members'] as const,
}
