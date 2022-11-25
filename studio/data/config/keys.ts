export const configKeys = {
  settings: (projectRef: string | undefined) => ['projects', projectRef, 'settings'] as const,
  api: (projectRef: string | undefined) => ['projects', projectRef, 'settings', 'api'] as const,
}
