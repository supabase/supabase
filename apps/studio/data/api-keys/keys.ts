export const apiKeysKeys = {
  list: (projectRef: string) => ['projects', projectRef, 'api-keys'] as const,
}
