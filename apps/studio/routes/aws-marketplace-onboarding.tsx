import { createFileRoute } from '@tanstack/react-router'

import AwsMarketplaceOnboardingPage from '@/pages/aws-marketplace-onboarding'

export const Route = createFileRoute('/aws-marketplace-onboarding')({
  component: AwsMarketplaceOnboardingRoute,
})

function AwsMarketplaceOnboardingRoute() {
  return <AwsMarketplaceOnboardingPage dehydratedState={undefined} />
}
