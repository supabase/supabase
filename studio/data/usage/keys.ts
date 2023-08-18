export const usageKeys = {
  usage: (projectRef: string | undefined) => ['projects', projectRef, 'usage'] as const,
  orgUsage: (orgSlug: string | undefined) => ['organizations', orgSlug, 'usage'] as const,
  resourceWarnings: () => ['project', 'resource-warnings'] as const,
}
