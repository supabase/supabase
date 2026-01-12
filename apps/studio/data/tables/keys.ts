export const tableKeys = {
  list: (projectRef: string | undefined, schema?: string, includeColumns?: boolean) =>
    ['projects', projectRef, 'tables', schema, includeColumns].filter(Boolean),
  retrieve: (projectRef: string | undefined, name: string, schema: string) =>
    ['projects', projectRef, 'table', schema, name].filter(Boolean),
  rolesAccess: (projectRef: string | undefined, schema: string) => [
    'projects',
    projectRef,
    'roles-access',
    { schema },
  ],
}
