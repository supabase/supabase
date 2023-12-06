export const replicaKeys = {
  list: (projectRef: string | undefined) => ['project', projectRef, 'replicas'] as const,
  statuses: (projectRef: string | undefined) =>
    ['project', projectRef, 'replicas-statuses'] as const,
}
