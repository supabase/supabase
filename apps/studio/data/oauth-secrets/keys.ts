export const clientSecretKeys = {
  list: (slug: string | undefined, appId: string | undefined) =>
    ['organizations', slug, 'oauth', 'apps', appId, 'client-secrets'] as const,
}
