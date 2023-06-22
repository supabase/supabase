export const oauthAppKeys = {
  list: (slug: string | undefined, type: 'published' | 'authorized' | undefined) =>
    ['oauth-apps', slug, type] as const,
}
