export const entityTypeKeys = {
  list: (projectRef: string | undefined, search?: string) =>
    ['projects', projectRef, 'entity-types', ...(search ? [{ search }] : [])] as const,
}
