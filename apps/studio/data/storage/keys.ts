export const storageKeys = {
  buckets: (projectRef: string | undefined) => ['projects', projectRef, 'buckets'] as const,
  analyticsBuckets: (projectRef: string | undefined) =>
    ['projects', projectRef, 'analytics-buckets'] as const,
  vectorBuckets: (projectRef: string | undefined) =>
    ['projects', projectRef, 'vector-buckets'] as const,
  vectorBucket: (projectRef: string | undefined, vectorbucketName: string | undefined) =>
    ['projects', projectRef, 'vector-bucket', vectorbucketName] as const,
  vectorBucketsIndexes: (projectRef: string | undefined, vectorBucketName: string | undefined) =>
    ['projects', projectRef, 'vector-buckets', vectorBucketName, 'indexes'] as const,
  archive: (projectRef: string | undefined) => ['projects', projectRef, 'archive'] as const,
  icebergNamespaces: (catalog: string, warehouse: string) =>
    ['catalog', catalog, 'warehouse', warehouse, 'namespaces'] as const,
  icebergNamespace: (catalog: string, warehouse: string, namespace: string) =>
    ['catalog', catalog, 'warehouse', warehouse, 'namespaces', namespace] as const,
  icebergNamespaceTables: (catalog: string, warehouse: string, namespace: string) =>
    ['catalog', catalog, 'warehouse', warehouse, 'namespaces', namespace, 'tables'] as const,
}
