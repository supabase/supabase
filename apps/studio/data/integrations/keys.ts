export const integrationKeys = {
  integrationsListWithOrg: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'integrations'] as const,
  integrationsList: () => ['organizations', 'integrations'] as const,
  vercelProjectList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-projects'] as const,
  vercelConnectionsList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-connections'] as const,
  githubBranch: (
    organization_integration_id: string | undefined,
    repo_owner: string,
    repo_name: string,
    branch_name: string
  ) => [
    'organizations',
    organization_integration_id,
    'branches',
    repo_owner,
    repo_name,
    branch_name,
  ],
  githubAuthorization: () => ['github-authorization'] as const,
  githubRepositoriesList: () => ['github-repositories'] as const,
  githubBranchesList: (connectionId: number | undefined) => ['github-branches', connectionId],
  githubConnectionsList: (organizationId: number | undefined) =>
    ['organizations', organizationId, 'github-connections'] as const,
  gitlabRepositoriesList: () => ['gitlab-repositories'] as const,
  gitlabConnectionsList: (organizationId: number | undefined) =>
    ['organizations', organizationId, 'gitlab-connections'] as const,
  gitlabAuthorization: () => ['gitlab-authorization'] as const,
  vercelRedirect: (installationId?: string) => ['vercel-redirect', installationId] as const,
}
