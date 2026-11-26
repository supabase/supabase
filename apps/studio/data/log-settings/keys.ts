export const logSettingsKeys = {
  detail: (projectRef: string | undefined) => ['projects', projectRef, 'log-settings'] as const,
}
