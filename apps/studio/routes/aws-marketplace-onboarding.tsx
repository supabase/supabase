import { createFileRoute } from '@tanstack/react-router'

import { AwsMarketplaceOnboardingScreen } from '@/components/interfaces/Organization/CloudMarketplace/AwsMarketplaceOnboarding'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/aws-marketplace-onboarding')({
  component: AwsMarketplaceOnboardingRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    buyer_id: typeof search.buyer_id === 'string' ? search.buyer_id : undefined,
  }),
})

function AwsMarketplaceOnboardingRoute() {
  return <AwsMarketplaceOnboardingPageWithAuth />
}

const PAGE_TITLE = buildStudioPageTitle({ section: 'Link AWS Marketplace', brand: 'Supabase' })

function AwsMarketplaceOnboardingPage() {
  const { buyer_id: buyerId } = Route.useSearch()

  return (
    <>
      <title>{PAGE_TITLE}</title>
      <AwsMarketplaceOnboardingScreen buyerId={buyerId} />
    </>
  )
}

const AwsMarketplaceOnboardingPageWithAuth = withAuth(AwsMarketplaceOnboardingPage)
