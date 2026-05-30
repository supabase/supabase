export const storageCredentialsKeys = {
  credentials: (projectRef: string | undefined) =>
    ['projects', projectRef, 'storage-credentials'] as const,
}
