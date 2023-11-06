export const viewKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'views'] as const,
  view: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'views', id] as const,
}
