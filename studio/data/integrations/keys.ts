export const integrationKeys = {
  integrationsListWithOrg: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'integrations'] as const,
  integrationsList: () => ['organizations', 'integrations'] as const,
  vercelProjectList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-projects'] as const,
  githubRepoList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'github-repos'] as const,
  vercelConnectionsList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-connections'] as const,
  githubConnectionsList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'github-connections'] as const,
}
