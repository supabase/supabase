export const vaultSecretsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'secrets'] as const,
}
