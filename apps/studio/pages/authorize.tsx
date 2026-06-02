import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { ApiAuthorizationScreen } from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import { APIAuthorizationLayout } from '@/components/layouts/APIAuthorizationLayout'
import { withAuth } from '@/hooks/misc/withAuth'
import type { NextPageWithLayout } from '@/types'

const APIAuthorizationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const routerReady = router.isReady
  const { auth_id, organization_slug } = useParams()

  if (!routerReady) {
    return null
  }

  return (
    <ApiAuthorizationScreen
      auth_id={auth_id}
      organization_slug={organization_slug}
      navigate={(destination) => router.push(destination)}
    />
  )
}

APIAuthorizationPage.getLayout = (page) => (
  <APIAuthorizationLayout HeadProvider={Head}>{page}</APIAuthorizationLayout>
)

export default withAuth(APIAuthorizationPage)
