export const jitDbAccessKeys = {
  status: (projectRef: string | undefined) => ['projects', projectRef, 'jit-db-access-members'] as const,
  members: (projectRef: string | undefined) => ['projects', projectRef, 'jit-db-access-status'] as const,
}
