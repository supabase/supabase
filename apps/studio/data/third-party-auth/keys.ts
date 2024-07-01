export const keys = {
  integrations: (projectRef: string | undefined) =>
    ['auth', projectRef, 'third-party-auth'] as const,
}
