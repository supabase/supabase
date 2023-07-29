export const integrationKeys = {
  integrationsListWithOrg: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'integrations'] as const,
  integrationsList: () => ['organizations', 'integrations'] as const,
  vercelProjectList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-projects'] as const,
  vercelConnectionsList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-connections'] as const,
  githubBranchesList: (
    organization_integration_id: string | undefined,
    repo_owner: string,
    repo_name: string
  ) => ['organizations', organization_integration_id, 'branches', repo_owner, repo_name],
}
