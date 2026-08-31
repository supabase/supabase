import Head from 'next/head'
import { useRouter } from 'next/router'

import { RedeemCreditsScreen } from '@/components/interfaces/RedeemCredits/RedeemCredits'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Redeem Credits', brand: 'Supabase' })

const RedeemCreditsPage: NextPageWithLayout = () => {
  const router = useRouter()

  if (!router.isReady) return null

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <RedeemCreditsScreen />
    </>
  )
}

export default withAuth(RedeemCreditsPage)
