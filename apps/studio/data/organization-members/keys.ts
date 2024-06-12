export const organizationKeys = {
  rolesV2: (slug: string | undefined) => ['organization-members', slug, 'roles-v2'] as const,
  invitations: (slug: string | undefined) => ['organization-members', slug, 'invitations'] as const,
  invitation: (slug: string | undefined, token: string | undefined) =>
    ['organization-members', slug, 'invitations', token] as const,
  token: (slug: string | undefined, token: string | undefined) =>
    ['organization-members', slug, 'token', token] as const,
}
