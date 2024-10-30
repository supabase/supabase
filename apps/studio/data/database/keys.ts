import { SupportedAssistantEntities } from 'components/ui/AIAssistantPanel/AIAssistant.types'

export const databaseKeys = {
  entityDefinition: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'entity-definition', id].filter(Boolean),
  entityDefinitions: (projectRef: string | undefined, schemas: string[]) =>
    ['projects', projectRef, 'entity-definitions', schemas] as const,
  backups: (projectRef: string | undefined) => [projectRef, 'database', 'backups'] as const,
  poolingConfiguration: (projectRef: string | undefined) =>
    [projectRef, 'database', 'pooling-configuration'] as const,
  indexesFromQuery: (projectRef: string | undefined, query: string) =>
    ['projects', projectRef, 'indexes', { query }] as const,
  indexAdvisorFromQuery: (projectRef: string | undefined, query: string) =>
    ['projects', projectRef, 'index-advisor', { query }] as const,
}
