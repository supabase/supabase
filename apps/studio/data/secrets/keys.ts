export const secretsKeys = {
  list: (projectRef: string | undefined) =>
    ['projects', projectRef, 'edge_functions_secrets'] as const,
}
