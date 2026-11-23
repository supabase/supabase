const replicationScope = (projectRef: string | undefined, clusterId?: string) =>
  clusterId === undefined
    ? (['projects', projectRef] as const)
    : (['projects', projectRef, 'replication', clusterId] as const)

// Publication create/update/delete invalidate this prefix to refresh names, details, and estimates.
const publicationsKey = (
  projectRef: string | undefined,
  sourceId: number | undefined,
  clusterId?: string
) => [...replicationScope(projectRef, clusterId), 'sources', sourceId, 'publications'] as const

export const replicationKeys = {
  clusters: () => ['replication', 'clusters'] as const,
  sources: (projectRef: string | undefined, clusterId?: string) =>
    [...replicationScope(projectRef, clusterId), 'sources'] as const,
  destinations: (projectRef: string | undefined, clusterId?: string) =>
    [...replicationScope(projectRef, clusterId), 'destinations'] as const,
  destinationById: (
    projectRef: string | undefined,
    destinationId: number | undefined | null,
    clusterId?: string
  ) => [...replicationScope(projectRef, clusterId), 'destinations', destinationId] as const,
  publications: publicationsKey,
  publicationNames: (
    projectRef: string | undefined,
    sourceId: number | undefined,
    clusterId?: string
  ) => [...publicationsKey(projectRef, sourceId, clusterId), 'list'] as const,
  publication: (
    projectRef: string | undefined,
    sourceId: number | undefined,
    publicationName: string | undefined,
    clusterId?: string
  ) => [...publicationsKey(projectRef, sourceId, clusterId), 'detail', publicationName] as const,
  tables: (projectRef: string | undefined, sourceId: number | undefined, clusterId?: string) =>
    [...replicationScope(projectRef, clusterId), 'sources', sourceId, 'tables'] as const,
  tableColumns: (
    projectRef: string | undefined,
    sourceId: number | undefined,
    tableId: number | undefined,
    clusterId?: string
  ) =>
    [
      ...replicationScope(projectRef, clusterId),
      'sources',
      sourceId,
      'tables',
      tableId,
      'columns',
    ] as const,
  costEstimate: (
    projectRef: string | undefined,
    sourceId: number | undefined,
    publicationName: string | undefined
  ) => [...publicationsKey(projectRef, sourceId), publicationName, 'cost-estimate'] as const,
  pipelines: (projectRef: string | undefined, clusterId?: string) =>
    [...replicationScope(projectRef, clusterId), 'pipelines'] as const,
  pipelineById: (
    projectRef: string | undefined,
    pipelineId: string | undefined,
    clusterId?: string
  ) => [...replicationScope(projectRef, clusterId), 'pipelines', pipelineId] as const,
  pipelinesStatus: (
    projectRef: string | undefined,
    pipelineId: string | undefined,
    clusterId?: string
  ) => [...replicationScope(projectRef, clusterId), 'pipelines', pipelineId, 'status'] as const,
  pipelinesReplicationStatus: (
    projectRef: string | undefined,
    pipelineId: string | undefined,
    clusterId?: string
  ) =>
    [
      ...replicationScope(projectRef, clusterId),
      'pipelines',
      pipelineId,
      'replication-status',
    ] as const,
  pipelinesVersion: (
    projectRef: string | undefined,
    pipelineId: string | undefined,
    clusterId?: string
  ) => [...replicationScope(projectRef, clusterId), 'pipelines', pipelineId, 'version'] as const,
}
