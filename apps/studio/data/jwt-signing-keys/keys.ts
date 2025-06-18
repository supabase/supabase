export const jwtSigningKeysKeys = {
  list: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
  legacy: (projectRef?: string) => ['projects', projectRef, 'legacy-jwt-signing-key'] as const,
}
