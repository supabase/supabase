export const replicationKeys = {
  clusters: () => ['replication', 'clusters'] as const,
  sources: (projectRef: string | undefined, clusterId = 'default') =>
    ['projects', projectRef, 'replication', clusterId, 'sources'] as const,
  destinations: (projectRef: string | undefined, clusterId = 'default') =>
    ['projects', projectRef, 'replication', clusterId, 'destinations'] as const,
  destinationById: (
    projectRef: string | undefined,
    destinationId: number | undefined | null,
    clusterId = 'default'
  ) => ['projects', projectRef, 'replication', clusterId, 'destinations', destinationId] as const,
  // Prefix shared by publicationNames, publication details, and cost-estimate keys.
  // Publication create/update/delete invalidate this so all three refresh together.
  publications: (
    projectRef: string | undefined,
    source_id: number | undefined,
    clusterId = 'default'
  ) =>
    [
      'projects',
      projectRef,
      'replication',
      clusterId,
      'sources',
      source_id,
      'publications',
    ] as const,
  publicationNames: (
    projectRef: string | undefined,
    source_id: number | undefined,
    clusterId = 'default'
  ) =>
    [
      'projects',
      projectRef,
      'replication',
      clusterId,
      'sources',
      source_id,
      'publications',
      'list',
    ] as const,
  publication: (
    projectRef: string | undefined,
    source_id: number | undefined,
    publicationName: string | undefined,
    clusterId = 'default'
  ) =>
    [
      'projects',
      projectRef,
      'replication',
      clusterId,
      'sources',
      source_id,
      'publications',
      'detail',
      publicationName,
    ] as const,
  tables: (projectRef: string | undefined, source_id: number | undefined, clusterId = 'default') =>
    ['projects', projectRef, 'replication', clusterId, 'sources', source_id, 'tables'] as const,
  tableColumns: (
    projectRef: string | undefined,
    source_id: number | undefined,
    tableId: number | undefined,
    clusterId = 'default'
  ) =>
    [
      'projects',
      projectRef,
      'replication',
      clusterId,
      'sources',
      source_id,
      'tables',
      tableId,
      'columns',
    ] as const,
  costEstimate: (
    projectRef: string | undefined,
    source_id: number | undefined,
    publicationName: string | undefined,
    clusterId = 'default'
  ) =>
    [
      'projects',
      projectRef,
      'replication',
      clusterId,
      'sources',
      source_id,
      'publications',
      publicationName,
      'cost-estimate',
    ] as const,
  pipelines: (projectRef: string | undefined, clusterId = 'default') =>
    ['projects', projectRef, 'replication', clusterId, 'pipelines'] as const,
  pipelineById: (
    projectRef: string | undefined,
    pipelineId: string | undefined,
    clusterId = 'default'
  ) => ['projects', projectRef, 'replication', clusterId, 'pipelines', pipelineId] as const,
  pipelinesStatus: (
    projectRef: string | undefined,
    pipelineId: string | undefined,
    clusterId = 'default'
  ) =>
    ['projects', projectRef, 'replication', clusterId, 'pipelines', pipelineId, 'status'] as const,
  pipelinesReplicationStatus: (
    projectRef: string | undefined,
    pipelineId: string | undefined,
    clusterId = 'default'
  ) =>
    [
      'projects',
      projectRef,
      'replication',
      clusterId,
      'pipelines',
      pipelineId,
      'replication-status',
    ] as const,
  pipelinesVersion: (
    projectRef: string | undefined,
    pipelineId: string | undefined,
    clusterId = 'default'
  ) =>
    ['projects', projectRef, 'replication', clusterId, 'pipelines', pipelineId, 'version'] as const,
}
