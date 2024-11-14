export const databaseKeys = {
  schemas: (projectRef: string | undefined) => ['projects', projectRef, 'schemas'] as const,
  entityDefinition: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'entity-definition', id] as const,
  entityDefinitions: (projectRef: string | undefined, schemas: string[]) =>
    ['projects', projectRef, 'entity-definitions', schemas] as const,
  tableDefinition: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'table-definition', id] as const,
  viewDefinition: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'view-definition', id] as const,
  backups: (projectRef: string | undefined) => [projectRef, 'database', 'backups'] as const,
  poolingConfiguration: (projectRef: string | undefined) =>
    [projectRef, 'database', 'pooling-configuration'] as const,
  indexesFromQuery: (projectRef: string | undefined, query: string) =>
    ['projects', projectRef, 'indexes', { query }] as const,
  indexAdvisorFromQuery: (projectRef: string | undefined, query: string) =>
    ['projects', projectRef, 'index-advisor', { query }] as const,
  tableConstraints: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'table-constraints', id] as const,
  foreignKeyConstraints: (projectRef: string | undefined, schema?: string) =>
    ['projects', projectRef, 'foreign-key-constraints', schema] as const,
}
