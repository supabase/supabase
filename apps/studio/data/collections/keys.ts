export const collectionKeys = {
  list: (projectRef: string | undefined) => ['collections', projectRef] as const,
  item: (projectRef: string | undefined, collectionToken: string) =>
    ['collections', projectRef, collectionToken] as const,
  create: (projectRef: string | undefined) => ['collections', projectRef, 'create'] as const,
}
