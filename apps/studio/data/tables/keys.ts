export const tableKeys = {
  list: (projectRef: string | undefined, schema?: string, includeColumns?: boolean) =>
    ['projects', projectRef, 'tables', schema, includeColumns].filter(Boolean),
  rolesAccess: (projectRef: string | undefined, schema: string, table: string) => [
    'projects',
    projectRef,
    'roles-access',
    { schema, table },
  ],
}
