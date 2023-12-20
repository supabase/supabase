export const tableKeys = {
  list: (projectRef: string | undefined, schema: string | undefined) =>
    ['projects', projectRef, 'tables', { schema }] as const,
  table: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'tables', id] as const,
}
