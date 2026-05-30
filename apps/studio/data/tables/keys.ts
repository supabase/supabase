export const tableKeys = {
  names: (projectRef: string | undefined) => ['projects', projectRef, 'table-names'] as const,
  list: (projectRef: string | undefined, schema?: string, includeColumns?: boolean) =>
    ['projects', projectRef, 'tables', schema, includeColumns].filter(Boolean),
  infiniteListPrefix: (projectRef: string | undefined, schema?: string) =>
    ['projects', projectRef, 'tables', 'infinite', schema].filter(
      (part) => part !== undefined && part !== null && part !== ''
    ),
  infiniteList: (
    projectRef: string | undefined,
    schema: string | undefined,
    options: { includeColumns?: boolean; pageSize?: number; nameFilter?: string }
  ) => [...tableKeys.infiniteListPrefix(projectRef, schema), options],
  retrieve: (projectRef: string | undefined, name: string, schema: string) =>
    ['projects', projectRef, 'table', schema, name].filter(Boolean),
}
