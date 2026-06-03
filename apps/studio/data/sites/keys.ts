export const sitesKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'sites'] as const,
  detail: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'sites', slug] as const,
  files: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'sites', slug, 'files'] as const,
}
