export const replicationKeys = {
  sources: (projectRef: string | undefined) => ['projects', projectRef, 'sources'] as const,
}
