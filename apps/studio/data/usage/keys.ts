export const usageKeys = {
  usage: (projectRef: string | undefined) => ['projects', projectRef, 'usage'] as const,
  orgUsage: (orgSlug: string | undefined, projectRef?: string, start?: string, end?: string) =>
    ['organizations', orgSlug, 'usage', projectRef, start, end] as const,
  resourceWarnings: () => ['projects', 'resource-warnings'] as const,
}
