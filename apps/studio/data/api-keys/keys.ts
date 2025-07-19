export const apiKeysKeys = {
  list: (projectRef?: string, reveal?: boolean) =>
    ['projects', projectRef, 'api-keys', reveal] as const,
  single: (projectRef?: string, id?: string) => ['projects', projectRef, 'api-keys', id] as const,
  status: (projectRef?: string) => ['projects', projectRef, 'api-keys', 'legacy'] as const,
}
