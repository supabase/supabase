export const oauthAppsKeys = {
  authorizeRequest: (id: string | undefined) => ['oauth-apps', 'authorize', id] as const,
  authorizeOrganizations: (id: string | undefined) =>
    ['oauth-apps', 'authorize', id, 'organizations'] as const,
  authorizeOrganizationProjects: (id: string | undefined, slug: string | undefined) =>
    ['oauth-apps', 'authorize', id, 'organizations', slug, 'projects'] as const,
  orgAppDetails: (slug: string | undefined, appId: string | undefined) =>
    ['oauth-apps', 'organizations', slug, 'apps', appId, 'grant'] as const,
  authorizedApps: (slug: string | undefined) => ['oauth-apps', 'authorized', slug] as const,
  appMemberGrants: (slug: string | undefined, appId: string | undefined) =>
    ['oauth-apps', 'authorized', slug, appId, 'member-grants'] as const,
}
