export const storageKeys = {
  buckets: (projectRef: string | undefined) => ['projects', projectRef, 'buckets'] as const,
}
