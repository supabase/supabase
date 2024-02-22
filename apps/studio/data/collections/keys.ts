export const collectionKeys = {
  list: (projectRef: string | undefined) => ['collections', projectRef] as const,
  item: (projectRef: string | undefined, collectionId: string) =>
    ['collections', projectRef, collectionId] as const,
  create: (projectRef: string | undefined) => ['collections', projectRef, 'create'] as const,
}
