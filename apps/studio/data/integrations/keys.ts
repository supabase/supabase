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
  githubBranchesList: (
    organization_integration_id: string | undefined,
    repo_owner: string,
    repo_name: string
  ) => ['organizations', organization_integration_id, 'branches', repo_owner, repo_name],
  githubPullRequestsList: (
    organization_integration_id: string | undefined,
    repo_owner: string,
    repo_name: string
  ) => ['organizations', organization_integration_id, 'pull-requests', repo_owner, repo_name],
  githubConnectionsList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'github-connections'] as const,
}
