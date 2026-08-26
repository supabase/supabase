export const replicationKeys = {
  sources: (projectRef: string | undefined) => ['projects', projectRef, 'sources'] as const,
  destinations: (projectRef: string | undefined) =>
    ['projects', projectRef, 'destinations'] as const,
  destinationById: (projectRef: string | undefined, destinationId: number | undefined | null) =>
    ['projects', projectRef, 'destinations', destinationId] as const,
  publications: (projectRef: string | undefined, source_id: number | undefined) =>
    ['projects', projectRef, 'sources', source_id, 'publications'] as const,
  publicationNames: (projectRef: string | undefined, source_id: number | undefined) =>
    ['projects', projectRef, 'sources', source_id, 'publications', 'list'] as const,
  publication: (
    projectRef: string | undefined,
    source_id: number | undefined,
    publicationName: string | undefined
  ) =>
    [
      'projects',
      projectRef,
      'sources',
      source_id,
      'publications',
      'detail',
      publicationName,
    ] as const,
  publicationsWithTables: (projectRef: string | undefined, source_id: number | undefined) =>
    ['projects', projectRef, 'sources', source_id, 'publications', 'with-tables'] as const,
  tables: (projectRef: string | undefined, source_id: number | undefined) =>
    ['projects', projectRef, 'sources', source_id, 'tables'] as const,
  tableColumns: (
    projectRef: string | undefined,
    source_id: number | undefined,
    tableId: number | undefined
  ) => ['projects', projectRef, 'sources', source_id, 'tables', tableId, 'columns'] as const,
  costEstimate: (
    projectRef: string | undefined,
    source_id: number | undefined,
    publicationName: string | undefined
  ) =>
    [
      'projects',
      projectRef,
      'sources',
      source_id,
      'publications',
      publicationName,
      'cost-estimate',
    ] as const,
  pipelines: (projectRef: string | undefined) => ['projects', projectRef, 'pipelines'] as const,
  pipelineById: (projectRef: string | undefined, pipelineId: number | undefined) =>
    ['projects', projectRef, 'pipelines', pipelineId] as const,
  pipelinesStatus: (projectRef: string | undefined, pipelineId: number | undefined) =>
    ['projects', projectRef, 'pipelines', pipelineId, 'status'] as const,
  pipelinesReplicationStatus: (projectRef: string | undefined, pipelineId: number | undefined) =>
    ['projects', projectRef, 'pipelines', pipelineId, 'replication-status'] as const,
  pipelinesVersion: (projectRef: string | undefined, pipelineId: number | undefined) =>
    ['projects', projectRef, 'pipelines', pipelineId, 'version'] as const,
}
