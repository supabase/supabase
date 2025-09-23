export const vaultSecretsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'secrets'] as const,
  getDecryptedValue: (projectRef: string | undefined, id: string) =>
    ['projects', projectRef, 'secrets', id] as const,
}
