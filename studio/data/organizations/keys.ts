export const organizationKeys = {
  detail: (slug: string | undefined) => ['organizations', slug, 'detail'] as const,
  roles: (slug: string | undefined) => ['organizations', slug, 'roles'] as const,
  freeProjectLimitCheck: (slug: string | undefined) =>
    ['organizations', slug, 'free-project-limit-check'] as const,
}
