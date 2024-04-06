export const tableKeys = {
  list: (
    projectRef: string | undefined,
    schema: string | undefined,
    includeColumns?: boolean | undefined
  ) => ['projects', projectRef, 'tables', { schema, includeColumns: !!includeColumns }] as const,
  table: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'tables', id] as const,
}
