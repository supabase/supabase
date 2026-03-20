export const edgeFunctionsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'edge-functions'] as const,
  lastHourStats: (projectRef: string | undefined) =>
    ['projects', projectRef, 'edge-functions', 'last-hour-stats'] as const,
  detail: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'detail'] as const,
  body: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'body'] as const,
}
