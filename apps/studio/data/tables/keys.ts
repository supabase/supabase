export const tableKeys = {
  list: (projectRef: string | undefined, schema: string | undefined, includeColumns?: boolean) =>
    ['projects', projectRef, 'tables', schema, includeColumns].filter(Boolean),
}
