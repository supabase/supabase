export const oauthAppsKeys = {
  authorizeRequest: (id: string | undefined) => ['oauth-apps', 'authorize', id] as const,
  authorizeOrganizations: (id: string | undefined) =>
    ['oauth-apps', 'authorize', id, 'organizations'] as const,
  authorizeOrganizationProjects: (id: string | undefined, slug: string | undefined) =>
    ['oauth-apps', 'authorize', id, 'organizations', slug, 'projects'] as const,
}
