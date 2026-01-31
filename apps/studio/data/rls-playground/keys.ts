export const rlsPlaygroundKeys = {
  all: ['rls-playground'] as const,
  roles: (projectRef: string | undefined) => [...rlsPlaygroundKeys.all, 'roles', projectRef] as const,
  tables: (projectRef: string | undefined, schema: string) =>
    [...rlsPlaygroundKeys.all, 'tables', projectRef, schema] as const,
  policies: (projectRef: string | undefined, schema: string, table: string) =>
    [...rlsPlaygroundKeys.all, 'policies', projectRef, schema, table] as const,
  rlsStatus: (projectRef: string | undefined, schema: string, table: string) =>
    [...rlsPlaygroundKeys.all, 'rls-status', projectRef, schema, table] as const,
  simulation: (projectRef: string | undefined) =>
    [...rlsPlaygroundKeys.all, 'simulation', projectRef] as const,
}
