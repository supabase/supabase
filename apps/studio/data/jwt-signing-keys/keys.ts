export const jwtSigningKeysKeys = {
  list: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
  legacy: (projectRef?: string) => ['projects', projectRef, 'legacy-jwt-signing-key'] as const,

  // invalidates all
  create: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
  update: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
}
