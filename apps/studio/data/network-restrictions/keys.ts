export const networkRestrictionKeys = {
  list: (projectRef: string | undefined) =>
    ['projects', projectRef, 'network-restrictions'] as const,
}
