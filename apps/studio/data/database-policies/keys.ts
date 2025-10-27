export const databasePoliciesKeys = {
  list: (projectRef: string | undefined, schema?: string) =>
    ['projects', projectRef, 'database-policies', schema].filter(Boolean),
}
