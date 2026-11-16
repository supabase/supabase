import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { StripeAtlasApplicationScreen } from '@/components/interfaces/StripeAtlasApplication/StripeAtlasApplication'
import { IS_PLATFORM } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Stripe Atlas Application', brand: 'Supabase' })

/**
 * Page needs to be pre-auth – customers will be redirected here from the
 * Stripe Atlas dashboard, either directly via a static link or via a callbackURL from the mgmt API.
 * The user's auth state doesn't matter for the application; what matters is the the query params of the callbackURL.
 *
 * Only available on the hosted platform – self-hosted Studio routes to 404.
 */
const StripeAtlasApplicationPage: NextPageWithLayout = () => {
  const router = useRouter()

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.replace('/404')
    }
  }, [router])

  if (!IS_PLATFORM) {
    return null
  }

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <StripeAtlasApplicationScreen />
    </>
  )
}

export default StripeAtlasApplicationPage
