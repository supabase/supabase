export const integrationKeys = {
  vercelProjectList: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'vercel-projects'] as const,
}
