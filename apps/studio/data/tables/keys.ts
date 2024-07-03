export const tableKeys = {
  list: (projectRef: string | undefined, schema: string | undefined, includeColumns?: boolean) =>
    ['projects', projectRef, 'tables', schema, includeColumns].filter(Boolean),
  table: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'tables', id] as const,
}
