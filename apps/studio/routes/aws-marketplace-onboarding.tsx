import { createFileRoute } from '@tanstack/react-router'

import LinkAwsMarketplaceLayout from '@/components/layouts/LinkAwsMarketplaceLayout'
import AwsMarketplaceOnboardingPage from '@/pages/aws-marketplace-onboarding'

export const Route = createFileRoute('/aws-marketplace-onboarding')({
  component: AwsMarketplaceOnboarding,
})

function AwsMarketplaceOnboarding() {
  return (
    <LinkAwsMarketplaceLayout>
      <AwsMarketplaceOnboardingPage dehydratedState={undefined} />
    </LinkAwsMarketplaceLayout>
  )
}
