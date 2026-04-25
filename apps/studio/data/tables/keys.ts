export const tableKeys = {
  names: (projectRef: string | undefined) => ['projects', projectRef, 'table-names'] as const,
  list: (projectRef: string | undefined, schema?: string, includeColumns?: boolean) =>
    ['projects', projectRef, 'tables', schema, includeColumns].filter(Boolean),
  retrieve: (projectRef: string | undefined, name: string, schema: string) =>
    ['projects', projectRef, 'table', schema, name].filter(Boolean),
}
