import { useParams } from 'common'

import { APIAuthorization } from 'components/interfaces/Organization/Authorize'
import { ProjectClaim } from 'components/interfaces/Organization/ProjectClaim'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import { withAuth } from 'hooks/misc/withAuth'
import Head from 'next/head'
import type { NextPageWithLayout } from 'types'

// Need to handle if no organizations in account
// Need to handle if not logged in yet state

const APIAuthorizationPage: NextPageWithLayout = () => {
  const { token: claimToken } = useParams()

  if (claimToken) {
    return (
      <>
        <Head>
          <title>Claim project | Supabase</title>
        </Head>
        <main className="flex-grow flex flex-col w-full h-full overflow-y-auto">
          <ProjectClaim />
        </main>
      </>
    )
  }

  return (
    <APIAuthorizationLayout>
      <APIAuthorization />
    </APIAuthorizationLayout>
  )
}

export default withAuth(APIAuthorizationPage)
