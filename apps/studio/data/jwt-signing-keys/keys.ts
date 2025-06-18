export const jwtSigningKeysKeys = {
  list: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
  legacy: (projectRef?: string) => ['projects', projectRef, 'legacy-jwt-signing-key'] as const,

  // invalidates all
  migrateLegacy: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
  create: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
  update: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
  delete: (projectRef?: string) => ['projects', projectRef, 'jwt-signing-keys'] as const,
}
