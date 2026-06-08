import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { ApiAuthorizationScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize API Access', brand: 'Supabase' })

const APIAuthorizationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const routerReady = router.isReady
  const { auth_id, organization_slug } = useParams()

  if (!routerReady) {
    return null
  }

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <ApiAuthorizationScreen
        auth_id={auth_id}
        organization_slug={organization_slug}
        navigate={(destination) => router.push(destination)}
      />
    </>
  )
}

export default withAuth(APIAuthorizationPage)
