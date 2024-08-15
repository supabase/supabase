export const pgSodiumKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'pg-sodium-keys'] as const,
}
