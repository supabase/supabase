export const oauthAppKeys = {
  oauthApps: (slug: string | undefined) => [slug, 'oauth-apps'] as const,
  authorizedApps: (slug: string | undefined) => [slug, 'authorized-apps'] as const,
}
