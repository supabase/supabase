export const sqlKeys = {
  query: (projectRef: string | undefined, query: string | undefined) =>
    ['projects', projectRef, 'query', query] as const,
}
