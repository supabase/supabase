export const integrationKeys = {
  list: (orgSlug: string | undefined) => ['organizations', orgSlug, 'integrations'] as const,
  vercelProjectList: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'vercel-projects'] as const,
}
