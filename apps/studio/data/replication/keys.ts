export const replicationKeys = {
  sources: (projectRef: string | undefined) => ['projects', projectRef, 'sources'] as const,
  publications: (projectRef: string | undefined, source_id: number) =>
    ['projects', projectRef, 'sources', source_id, 'publications'] as const,
}
