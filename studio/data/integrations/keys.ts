export const integrationKeys = {
  list: (orgSlug: string | undefined) => ['organizations', orgSlug, 'integrations'] as const,
  vercelProjectList: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'vercel-projects'] as const,
  vercelConnectionsList: (organization_integration_id: string | undefined) =>
    ['organizations', organization_integration_id, 'vercel-connections'] as const,
}
