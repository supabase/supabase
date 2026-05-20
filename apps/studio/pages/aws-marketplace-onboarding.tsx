import Head from 'next/head'
import { useRouter } from 'next/router'

import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  getConnectMockState,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import {
  AWS_MARKETPLACE_MOCK_STATES,
  AwsMarketplaceOnboardingScreen,
  type AwsMarketplaceMockState,
} from '@/components/interfaces/Organization/CloudMarketplace/AwsMarketplaceOnboarding'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Link AWS Marketplace', brand: 'Supabase' })

const AwsMarketplaceOnboardingPage: NextPageWithLayout = () => {
  const router = useRouter()
  const buyerId = typeof router.query.buyer_id === 'string' ? router.query.buyer_id : undefined
  const mock =
    router.isReady && isTemporaryConnectMockPreviewEnabled()
      ? getConnectMockState(router.query.mock, AWS_MARKETPLACE_MOCK_STATES)
      : undefined

  const replaceMockState = (state: AwsMarketplaceMockState) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, mock: state } },
      undefined,
      { shallow: true }
    )
  }

  if (!router.isReady) return null

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      {mock && (
        <ConnectPreviewToolbar>
          <ConnectMockMenu
            state={mock}
            states={AWS_MARKETPLACE_MOCK_STATES}
            onSelect={replaceMockState}
          />
        </ConnectPreviewToolbar>
      )}
      <AwsMarketplaceOnboardingScreen buyerId={buyerId} mock={mock} />
    </>
  )
}

export default withAuth(AwsMarketplaceOnboardingPage)
