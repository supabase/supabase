export const recoveryInterstitialKeys = {
  identities: (userId?: string) => ['recovery-interstitial', userId, 'identities'] as const,
  factors: (userId?: string) => ['recovery-interstitial', userId, 'factors'] as const,
  codes: (userId?: string) => ['recovery-interstitial', userId, 'codes'] as const,
}
