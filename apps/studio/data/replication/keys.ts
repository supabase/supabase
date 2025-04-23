export const replicationKeys = {
  sources: (projectRef: string | undefined) => ['projects', projectRef, 'sources'] as const,
  sinks: (projectRef: string | undefined) => ['projects', projectRef, 'sinks'] as const,
  sinkById: (projectRef: string | undefined, sinkId: number | undefined) =>
    ['projects', projectRef, 'sinks', sinkId] as const,
  publications: (projectRef: string | undefined, source_id: number | undefined) =>
    ['projects', projectRef, 'sources', source_id, 'publications'] as const,
  tables: (projectRef: string | undefined, source_id: number | undefined) =>
    ['projects', projectRef, 'sources', source_id, 'tables'] as const,
  pipelines: (projectRef: string | undefined) => ['projects', projectRef, 'pipelines'] as const,
  pipelineById: (projectRef: string | undefined, pipelineId: number | undefined) =>
    ['projects', projectRef, 'pipelines', pipelineId] as const,
  pipelinesStatus: (projectRef: string | undefined, pipelineId: number | undefined) =>
    ['projects', projectRef, 'pipelines', pipelineId, 'status'] as const,
}
