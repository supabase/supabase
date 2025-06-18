export const jwtSigningKeysKeys = {
  list: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
}
