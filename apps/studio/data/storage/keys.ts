export const storageKeys = {
  buckets: (projectRef: string | undefined) => ['projects', projectRef, 'buckets'] as const,
  archive: (projectRef: string | undefined) => ['projects', projectRef, 'archive'] as const,
  icebergNamespace: (catalog: string, warehouse: string, namespace: string) =>
    ['catalog', catalog, 'warehouse', warehouse, 'namespaces', namespace] as const,
}
