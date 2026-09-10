import Head from 'next/head'

import { StripeAtlasApplicationScreen } from '@/components/interfaces/StripeAtlasApplication/StripeAtlasApplication'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Stripe Atlas', brand: 'Supabase' })

// Intentionally not wrapped in withAuth — Stripe Atlas merchants land here straight from the Atlas
// dashboard, so the page has to work without a Supabase session.
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
