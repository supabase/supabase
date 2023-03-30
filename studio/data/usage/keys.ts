export const usageKeys = {
  usage: (projectRef: string | undefined) => ['projects', projectRef, 'usage'] as const,
}
