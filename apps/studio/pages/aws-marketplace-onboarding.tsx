import Head from 'next/head'
import { useRouter } from 'next/router'

import { AwsMarketplaceOnboardingScreen } from '@/components/interfaces/Organization/CloudMarketplace/AwsMarketplaceOnboarding'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Link AWS Marketplace', brand: 'Supabase' })

const AwsMarketplaceOnboardingPage: NextPageWithLayout = () => {
  const router = useRouter()
  const buyerId = typeof router.query.buyer_id === 'string' ? router.query.buyer_id : undefined

  if (!router.isReady) return null

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <AwsMarketplaceOnboardingScreen buyerId={buyerId} />
    </>
  )
}

export default withAuth(AwsMarketplaceOnboardingPage)
