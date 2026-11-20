export const databasePoliciesKeys = {
  list: (projectRef: string | undefined, schemas?: string[]) =>
    ['projects', projectRef, 'database-policies', schemas].filter(Boolean),
}
