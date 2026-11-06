export const rlsPlaygroundKeys = {
  all: ['rls-playground'] as const,
  roles: (projectRef: string | undefined, connectionString?: string | null) =>
    [...rlsPlaygroundKeys.all, 'roles', projectRef, connectionString ?? null] as const,
  tables: (projectRef: string | undefined, schema: string, connectionString?: string | null) =>
    [...rlsPlaygroundKeys.all, 'tables', projectRef, schema, connectionString ?? null] as const,
  policies: (
    projectRef: string | undefined,
    schema: string,
    table: string,
    connectionString?: string | null
  ) => [...rlsPlaygroundKeys.all, 'policies', projectRef, schema, table, connectionString ?? null] as const,
  rlsStatus: (projectRef: string | undefined, schema: string, table: string) =>
    [...rlsPlaygroundKeys.all, 'rls-status', projectRef, schema, table] as const,
  simulation: (projectRef: string | undefined) =>
    [...rlsPlaygroundKeys.all, 'simulation', projectRef] as const,
}
