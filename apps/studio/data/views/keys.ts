export const viewKeys = {
  view: (projectRef: string | undefined, id: number | undefined) =>
    [...viewKeys.list(projectRef), id] as const,
}
