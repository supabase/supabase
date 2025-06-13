export const apiKeysKeys = {
  list: (projectRef?: string) => ['projects', projectRef, 'api-keys'] as const,
  single: (projectRef?: string, id?: string) => ['projects', projectRef, 'api-keys', id] as const,
}

export const legacyAPIKeysEnabledKeys = {
  enabled: (projectRef?: string) => ['projects', projectRef, 'api-keys', 'legacy'] as const,
}
