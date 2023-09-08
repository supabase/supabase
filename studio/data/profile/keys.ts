export const profileKeys = {
  profile: () => ['profile'] as const,
  mfaFactors: () => ['mfa', 'factors'] as const,
  aaLevel: () => ['mfa', 'aaLevel'] as const,
}
