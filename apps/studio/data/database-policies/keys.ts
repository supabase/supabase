export const databasePoliciesKeys = {
  list: (projectRef: string | undefined, schema?: string | undefined) =>
    ['projects', projectRef, 'database-policies', schema].filter(Boolean),
}
