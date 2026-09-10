export const cloudMarketplaceKeys = {
  onboardingInfo: (buyerId: string) => ['cloud-marketplace', 'onboarding-info', buyerId],
  contractLinkingEligibility: (buyerId: string) => [
    'cloud-marketplace',
    'contract-linking-eligibility',
    buyerId,
  ],
}
