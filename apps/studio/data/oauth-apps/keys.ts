export const oauthAppsKeys = {
  authorizeRequest: (id: string | undefined) => ['oauth-apps', 'authorize', id] as const,
  authorizeOrganizations: (id: string | undefined) =>
    ['oauth-apps', 'authorize', id, 'organizations'] as const,
  authorizeOrganizationProjects: (id: string | undefined, slug: string | undefined) =>
    ['oauth-apps', 'authorize', id, 'organizations', slug, 'projects'] as const,
  orgAppDetails: (slug: string | undefined, appId: string | undefined) =>
    ['oauth-apps', 'organizations', slug, 'apps', appId, 'grant'] as const,
  preflightValidation: (slug: string | undefined, appId: string | undefined) =>
    ['oauth-apps', 'organizations', slug, 'apps', appId, 'preflight-validation'] as const,
  // cursor omitted (rather than passed as `undefined`) so the cursor-less key is a true prefix
  // of every paginated key — invalidating without a cursor clears every cached page.
  approvals: (slug: string | undefined, cursor?: string) =>
    cursor === undefined
      ? (['oauth-apps', 'approvals', slug] as const)
      : (['oauth-apps', 'approvals', slug, cursor] as const),
  appMemberGrants: (slug: string | undefined, appId: string | undefined, cursor?: string) =>
    cursor === undefined
      ? (['oauth-apps', 'authorized', slug, appId, 'member-grants'] as const)
      : (['oauth-apps', 'authorized', slug, appId, 'member-grants', cursor] as const),
  grants: (cursor?: string) =>
    cursor === undefined
      ? (['oauth-apps', 'grants'] as const)
      : (['oauth-apps', 'grants', cursor] as const),
}
