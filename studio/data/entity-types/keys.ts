export const entityTypeKeys = {
  list: (projectRef: string | undefined, search: string | undefined) =>
    ['projects', projectRef, 'entity-types', { search }] as const,
}
