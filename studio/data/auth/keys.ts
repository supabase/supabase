export const authKeys = {
  users: (
    projectRef: string | undefined,
    {
      page,
      keywords,
      verified,
    }: { page: number | undefined; keywords: string | undefined; verified: string | undefined }
  ) => ['auth', projectRef, 'users', { page, keywords, verified }] as const,
  authConfig: (projectRef: string | undefined) => ['auth', projectRef, 'config'] as const,
  accessToken: () => ['access-token'] as const,
}
