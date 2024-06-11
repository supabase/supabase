export const organizationKeys = {
  rolesV2: (slug: string | undefined) => ['organizations', slug, 'roles-v2'] as const,
  invitations: (slug: string | undefined) => ['organizations', slug, 'invitations'] as const,
  invitation: (slug: string | undefined, token: string | undefined) =>
    ['organizations', slug, 'invitations', token] as const,
}
