export const customDomainKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'custom-domains'] as const,
  reverify: (projectRef: string | undefined) =>
    ['projects', projectRef, 'custom-domains', 'reverify'] as const,
}
