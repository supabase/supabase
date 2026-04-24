export const normalizeFunctionIds = (functionIds: string[]): string[] =>
  Array.from(new Set(functionIds)).sort()

export const edgeFunctionsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'edge-functions'] as const,
  lastHourStats: (projectRef: string | undefined, functionIds: string[] = []) =>
    [
      'projects',
      projectRef,
      'edge-functions',
      'last-hour-stats',
      normalizeFunctionIds(functionIds),
    ] as const,
  detail: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'detail'] as const,
  body: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'body'] as const,
}
