import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'

import {
  API_AUTHORIZATION_MOCK_STATES,
  ApiAuthorizationScreen,
  getApiAuthorizationMockState,
} from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize API access', brand: 'Supabase' })

const APIAuthorizationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const routerReady = router.isReady
  const { auth_id, organization_slug } = useParams()
  const mock = isTemporaryConnectMockPreviewEnabled()
    ? getApiAuthorizationMockState(router.query.mock)
    : undefined

  const replaceMockState = (state: (typeof API_AUTHORIZATION_MOCK_STATES)[number]) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, mock: state } },
      undefined,
      { shallow: true }
    )
  }

  if (!routerReady) {
    return null
  }

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      {mock && (
        <ConnectPreviewToolbar>
          <ConnectMockMenu
            state={mock}
            states={API_AUTHORIZATION_MOCK_STATES}
            onSelect={replaceMockState}
            width="w-[240px]"
          />
        </ConnectPreviewToolbar>
      )}
      <ApiAuthorizationScreen
        auth_id={auth_id}
        organization_slug={organization_slug}
        navigate={(destination) => router.push(destination)}
        mock={mock}
      />
    </>
  )
}

export default withAuth(APIAuthorizationPage)
