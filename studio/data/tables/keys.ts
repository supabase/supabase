export const tableKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'tables'] as const,
  table: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'tables', id] as const,
}
