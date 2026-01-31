export const databaseKeys = {
  schemas: (projectRef: string | undefined) => ['projects', projectRef, 'schemas'] as const,
  keywords: (projectRef: string | undefined) => ['projects', projectRef, 'keywords'] as const,
  migrations: (projectRef: string | undefined) => ['projects', projectRef, 'migrations'] as const,
  tableColumns: (
    projectRef: string | undefined,
    schema: string | undefined,
    table: string | undefined
  ) => ['projects', projectRef, 'table-columns', schema, table] as const,
  databaseFunctions: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database-functions'] as const,
  entityDefinition: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'entity-definition', id] as const,
  entityDefinitions: (projectRef: string | undefined, schemas: string[]) =>
    ['projects', projectRef, 'entity-definitions', schemas] as const,
  tableDefinition: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'table-definition', id] as const,
  viewDefinition: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'view-definition', id] as const,
  backups: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database', 'backups'] as const,
  poolingConfiguration: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database', 'pooling-configuration'] as const,
  indexesFromQuery: (projectRef: string | undefined, query: string) =>
    ['projects', projectRef, 'indexes', { query }] as const,
  indexAdvisorFromQuery: (projectRef: string | undefined, query: string) =>
    ['projects', projectRef, 'index-advisor', { query }] as const,
  tableConstraints: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'table-constraints', id] as const,
  foreignKeyConstraints: (projectRef: string | undefined, schema?: string) =>
    ['projects', projectRef, 'foreign-key-constraints', schema] as const,
  databaseSize: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database-size'] as const,
  maxConnections: (projectRef: string | undefined) =>
    ['projects', projectRef, 'max-connections'] as const,
  pgbouncerStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'pgbouncer', 'status'] as const,
  pgbouncerConfig: (projectRef: string | undefined) =>
    ['projects', projectRef, 'pgbouncer', 'config'] as const,
  checkPrimaryKeysExists: (
    projectRef: string | undefined,
    tables: { name: string; schema: string }[]
  ) => ['projects', projectRef, 'check-primary-keys', tables] as const,
  tableIndexAdvisor: (
    projectRef: string | undefined,
    schema: string | undefined,
    table: string | undefined
  ) => ['projects', projectRef, 'table-index-advisor', schema, table] as const,
  supamonitorEnabled: (projectRef: string | undefined) =>
    ['projects', projectRef, 'supamonitor-enabled'] as const,
}
