export const replicaKeys = {
  list: (projectRef: string | undefined) => ['project', projectRef, 'replicas'] as const,
}
