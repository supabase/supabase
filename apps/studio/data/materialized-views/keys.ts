export const materializedViewKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'materializedViews'] as const,
  materializedView: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'materializedViews', id] as const,
}
