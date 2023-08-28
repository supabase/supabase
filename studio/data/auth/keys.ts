export const authKeys = {
  authConfig: (projectRef: string | undefined) => ['auth', projectRef, 'config'] as const,
  accessToken: () => ['access-token'] as const,
}
