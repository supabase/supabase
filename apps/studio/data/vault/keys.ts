export const vaultSecretsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'secrets'] as const,
  getDecryptedValue: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'secrets', id].filter(Boolean),
}
