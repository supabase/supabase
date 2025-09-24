export const jitDbAccessKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'jit-db-access'] as const,
}
