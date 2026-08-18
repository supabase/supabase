export const storageKeys = {
  bucket: (projectRef: string | undefined, bucketId: string | undefined) =>
    ['projects', projectRef, 'buckets', bucketId] as const,
  buckets: (projectRef: string | undefined) => ['projects', projectRef, 'buckets'] as const,
  bucketsList: (
    projectRef: string | undefined,
    params: {
      limit?: number
      search?: string
      sortColumn?: string
      sortOrder?: string
    } = {}
  ) =>
    [
      'projects',
      projectRef,
      'buckets',
      'list',
      {
        limit: params.limit,
        search: params.search,
        sortColumn: params.sortColumn,
        sortOrder: params.sortOrder,
      },
    ] as const,
  analyticsBuckets: (projectRef: string | undefined) =>
    ['projects', projectRef, 'analytics-buckets'] as const,
  vectorBuckets: (projectRef: string | undefined) =>
    ['projects', projectRef, 'vector-buckets'] as const,
  vectorBucket: (projectRef: string | undefined, vectorbucketName: string | undefined) =>
    ['projects', projectRef, 'vector-bucket', vectorbucketName] as const,
  vectorBucketsIndexes: (projectRef: string | undefined, vectorBucketName: string | undefined) =>
    ['projects', projectRef, 'vector-buckets', vectorBucketName, 'indexes'] as const,
  archive: (projectRef: string | undefined) => ['projects', projectRef, 'archive'] as const,
  publicBucketsWithSelectPolicies: (projectRef: string | undefined, bucketId: string | undefined) =>
    ['projects', projectRef, 'public-buckets-with-select-policies', bucketId] as const,
  objects: (
    projectRef: string | undefined,
    bucketId: string | undefined,
    path: string,
    params: {
      limit?: number
      search?: string
      sortColumn?: string
      sortOrder?: string
    } = {}
  ) =>
    [
      'projects',
      projectRef,
      'buckets',
      bucketId,
      'objects',
      ...(path ? [path] : []),
      ...(params ? [params] : []),
    ] as const,
  /**
   * The lifecycle policy is part of the key because the API applies it when
   * deriving each version's expiry, so editing the policy must invalidate the
   * cached version list rather than leave a stale one behind.
   */
  objectVersions: (
    projectRef: string | undefined,
    bucketId: string | undefined,
    objectName: string | undefined,
    lifecyclePolicy?: { expiryDays: number | null; maxVersions: number | null }
  ) =>
    [
      'projects',
      projectRef,
      'buckets',
      bucketId,
      'object-versions',
      objectName,
      ...(lifecyclePolicy ? [lifecyclePolicy] : []),
    ] as const,
  /** Org-scoped: storage retention is billed per organization, not per project. */
  retentionUsage: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'storage-retention-usage'] as const,
  icebergNamespaces: ({ projectRef, warehouse }: { projectRef?: string; warehouse?: string }) =>
    [projectRef, 'warehouse', warehouse, 'namespaces'] as const,
  icebergNamespace: ({
    projectRef,
    warehouse,
    namespace,
  }: {
    projectRef?: string
    warehouse: string
    namespace: string
  }) => [projectRef, 'warehouse', warehouse, 'namespaces', namespace] as const,
  icebergNamespaceTables: ({
    projectRef,
    warehouse,
    namespace,
  }: {
    projectRef?: string
    warehouse?: string
    namespace?: string
  }) => [projectRef, 'warehouse', warehouse, 'namespaces', namespace, 'tables'] as const,
}
