export const orgSSOKeys = {
  orgSSOConfig: (orgSlug: string | undefined) => ['organizations', orgSlug, 'sso'] as const,
}
