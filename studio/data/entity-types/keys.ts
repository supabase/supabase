export const entityTypeKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'entity-types'] as const,
}
