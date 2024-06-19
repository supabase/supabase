export const resourceKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'resources'] as const,
  resource: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'resources', id] as const,
}
