import Head from 'next/head'

import { StripeAtlasApplicationScreen } from '@/components/interfaces/StripeAtlasApplication/StripeAtlasApplication'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Stripe Atlas Application', brand: 'Supabase' })

/**
 * Page needs to be pre-auth – customers will be redirected here from the
 * Stripe Atlas dashboard, either directly via a static link or via a callbackURL from the mgmt API.
 * The user's auth state doesn't matter for the application; what matters is the the query params of the callbackURL.
 */
const StripeAtlasApplicationPage: NextPageWithLayout = () => {
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
