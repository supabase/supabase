export const replicationKeys = {
  sources: (projectRef: string | undefined) => ['projects', projectRef, 'sources'] as const,
  destinations: (projectRef: string | undefined) =>
    ['projects', projectRef, 'destinations'] as const,
  destinationById: (projectRef: string | undefined, destinationId: number | undefined) =>
    ['projects', projectRef, 'destinations', destinationId] as const,
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
