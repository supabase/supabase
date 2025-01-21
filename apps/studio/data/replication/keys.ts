export const replicationKeys = {
  sources: (projectRef: string | undefined) => ['projects', projectRef, 'sources'] as const,
  sinks: (projectRef: string | undefined) => ['projects', projectRef, 'sinks'] as const,
  publications: (projectRef: string | undefined, source_id: number | undefined) =>
    ['projects', projectRef, 'sources', source_id, 'publications'] as const,
  tables: (projectRef: string | undefined, source_id: number) =>
    ['projects', projectRef, 'sources', source_id, 'tables'] as const,
  pipelines: (projectRef: string | undefined) => ['projects', projectRef, 'pipelines'] as const,
  pipelinesStatus: (projectRef: string | undefined, pipelineId: number) =>
    ['projects', projectRef, 'pipelines', pipelineId, 'status'] as const,
}
