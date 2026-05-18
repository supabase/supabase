import Head from 'next/head'
import { useRouter } from 'next/router'

import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  getConnectMockState,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import {
  REDEEM_CREDITS_MOCK_STATES,
  RedeemCreditsMockState,
} from '@/components/interfaces/RedeemCredits/MockState'
import { RedeemCreditsScreen } from '@/components/interfaces/RedeemCredits/RedeemCredits'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Redeem Credits', brand: 'Supabase' })

const RedeemCreditsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const mock =
    router.isReady && isTemporaryConnectMockPreviewEnabled()
      ? getConnectMockState(router.query.mock, REDEEM_CREDITS_MOCK_STATES)
      : undefined

  const replaceMockState = (state: RedeemCreditsMockState) => {
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
            states={REDEEM_CREDITS_MOCK_STATES}
            onSelect={replaceMockState}
          />
        </ConnectPreviewToolbar>
      )}
      <RedeemCreditsScreen mock={mock} />
    </>
  )
}

export default withAuth(RedeemCreditsPage)
