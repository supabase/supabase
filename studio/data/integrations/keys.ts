export const integrationKeys = {
  list: (orgSlug: string | undefined) => ['organizations', orgSlug, 'integrations'] as const,
  vercelProjectList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-projects'] as const,
  vercelConnectionsList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-connections'] as const,
}
