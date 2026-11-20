export const platformAppKeys = {
  list: (slug: string | undefined) => ['organizations', slug, 'platform-apps'] as const,
  detail: (slug: string | undefined, id: string | undefined) =>
    ['organizations', slug, 'platform-apps', id] as const,
  signingKeys: (slug: string | undefined, appId: string | undefined) =>
    ['organizations', slug, 'platform-apps', appId, 'signing-keys'] as const,
  installations: (slug: string | undefined) =>
    ['organizations', slug, 'platform-app-installations'] as const,
}
