export const usageKeys = {
  usage: (projectRef: string | undefined) => ['projects', projectRef, 'usage'] as const,
  orgUsage: (orgSlug: string | undefined) => ['organizations', orgSlug, 'usage'] as const,
  resourceWarnings: () => ['projects', 'resource-warnings'] as const,
}
